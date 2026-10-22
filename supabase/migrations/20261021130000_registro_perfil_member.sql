-- =====================================================================
-- Registro · Perfil "member" automático
--
--   · Cada cuenta nueva de auth.users recibe un perfil con rol "member"
--     (solo ve su perfil). Un admin la asciende después.
--   · El rol NUNCA sale de los metadatos del registro: el usuario los
--     controla. Solo se toma el nombre.
--   · No vincula perfiles existentes por correo (ver núcleo 04). Si el
--     correo ya lo usa otro perfil, se crea sin correo para no bloquear
--     el registro; un admin decide si unirlos.
--   · Un error aquí nunca impide crear la cuenta.
--   · Rellena las cuentas que ya existan sin perfil.
-- =====================================================================

begin;

create or replace function private.create_member_profile()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_member uuid;
  v_name   text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
begin
  if exists (select 1 from public.profiles where auth_user_id = new.id) then
    return new;
  end if;

  select id into v_member from public.roles where name = 'member';

  begin
    insert into public.profiles (auth_user_id, full_name, email, role, role_id, is_active)
    values (new.id, v_name, new.email, 'member', v_member, true);
  exception when unique_violation then
    insert into public.profiles (auth_user_id, full_name, email, role, role_id, is_active)
    values (new.id, v_name, null, 'member', v_member, true)
    on conflict do nothing;
  end;

  return new;
exception when others then
  raise warning 'create_member_profile(%): %', new.id, sqlerrm;
  return new;
end
$$;

revoke all on function private.create_member_profile() from public;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_member_profile();

-- Cuentas existentes sin perfil
insert into public.profiles (auth_user_id, full_name, email, role, role_id, is_active)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
                split_part(u.email, '@', 1)),
       case when exists (select 1 from public.profiles p
                         where lower(p.email) = lower(u.email))
            then null else u.email end,
       'member',
       (select id from public.roles where name = 'member'),
       true
from auth.users u
where not exists (select 1 from public.profiles p where p.auth_user_id = u.id);

commit;
