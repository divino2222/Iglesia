-- =====================================================================
-- Núcleo · Paso 1 · Roles: role_id es la única fuente de verdad
--
--   · Crea el rol "member" (ver su perfil y sus notificaciones).
--   · Llena profiles.role_id a partir del texto profiles.role.
--     Si ya hay role_id, gana role_id (es lo que usa getCurrentAccess).
--   · Normaliza profiles.role al nombre del rol (servidor → server, etc.).
--   · Trigger temporal que mantiene role y role_id sincronizados mientras
--     el código siga escribiendo el texto. Se elimina en el Paso 6.
--   · profiles.role_id pasa a ser NOT NULL.
--
-- Transacción única: si cualquier verificación falla, no se aplica nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0) Verificaciones previas
-- ---------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(r.name, ', ')
  into v_missing
  from unnest(array['admin', 'coordinator', 'pastor', 'ministry_leader',
                    'server', 'new_volunteer']) as r(name)
  where not exists (select 1 from public.roles x where x.name = r.name);

  if v_missing is not null then
    raise exception 'Faltan roles en public.roles: %', v_missing;
  end if;

  if (select count(*) from public.permissions
      where name in ('profile.manage_own', 'notifications.view')) < 2 then
    raise exception 'Faltan los permisos profile.manage_own y/o notifications.view';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 1) Rol "member" con permisos mínimos
-- ---------------------------------------------------------------------
do $$
declare
  v_id_type  text;
  v_perm_col text;
  v_member   public.roles.id%type;
begin
  if not exists (select 1 from public.roles where name = 'member') then
    select data_type into v_id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'roles' and column_name = 'id';

    if v_id_type = 'uuid' then
      insert into public.roles (id, name, label)
      values (gen_random_uuid(), 'member', 'Miembro');
    else
      insert into public.roles (name, label) values ('member', 'Miembro');
    end if;
  end if;

  select id into v_member from public.roles where name = 'member';

  -- Columna de role_permissions que apunta a permissions
  select a.attname into v_perm_col
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
  where c.conrelid = 'public.role_permissions'::regclass
    and c.confrelid = 'public.permissions'::regclass
    and c.contype = 'f'
  limit 1;

  if v_perm_col is null then
    raise exception 'No encontré la FK de role_permissions hacia permissions';
  end if;

  execute format(
    'insert into public.role_permissions (role_id, %1$I)
     select $1, p.id
     from public.permissions p
     where p.name = any ($2)
       and not exists (select 1 from public.role_permissions rp
                       where rp.role_id = $1 and rp.%1$I = p.id)',
    v_perm_col)
  using v_member, array['profile.manage_own', 'notifications.view'];
end
$$;

-- ---------------------------------------------------------------------
-- 2) Traducción de los textos usados en formularios y datos
-- ---------------------------------------------------------------------
create or replace function private.role_name_from_text(p_role text)
returns text
language sql immutable
set search_path = ''
as $$
  select case lower(trim(p_role))
    when 'admin'           then 'admin'
    when 'administrador'   then 'admin'
    when 'coordinator'     then 'coordinator'
    when 'coordinador'     then 'coordinator'
    when 'pastor'          then 'pastor'
    when 'ministry_leader' then 'ministry_leader'
    when 'team_leader'     then 'team_leader'
    when 'server'          then 'server'
    when 'servidor'        then 'server'
    when 'new_volunteer'   then 'new_volunteer'
    when 'member'          then 'member'
    when 'miembro'         then 'member'
    when 'invitado'        then 'member'
    else null
  end
$$;

-- ---------------------------------------------------------------------
-- 3) Textos que no sabemos traducir (detiene la migración)
-- ---------------------------------------------------------------------
do $$
declare
  v_unknown text;
begin
  select string_agg(distinct coalesce(role, '(vacío)'), ', ')
  into v_unknown
  from public.profiles
  where role_id is null
    and role is not null
    and private.role_name_from_text(role) is null;

  if v_unknown is not null then
    raise exception 'Valores de profiles.role sin traducción: %. Agrégalos a private.role_name_from_text.', v_unknown;
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 4) Llenar role_id vacío y normalizar el texto
--    (sin role ni role_id → member, el rol con menos permisos)
-- ---------------------------------------------------------------------
update public.profiles p
set role_id = r.id
from public.roles r
where p.role_id is null
  and r.name = coalesce(private.role_name_from_text(p.role), 'member');

update public.profiles p
set role = r.name
from public.roles r
where r.id = p.role_id
  and p.role is distinct from r.name;

-- ---------------------------------------------------------------------
-- 5) Sincronización temporal role ↔ role_id
--    · Si cambia role_id, gana role_id (panel /admin/usuarios).
--    · Si solo cambia role (código viejo), se traduce a role_id.
--    · Un texto desconocido al insertar cae en "member".
-- ---------------------------------------------------------------------
create or replace function private.sync_profile_role()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if tg_op = 'INSERT' then
    if new.role_id is null then
      select id into new.role_id
      from public.roles
      where name = coalesce(private.role_name_from_text(new.role), 'member');
    end if;
  elsif new.role_id is not distinct from old.role_id
        and new.role is distinct from old.role then
    v_name := private.role_name_from_text(new.role);

    if v_name is not null then
      select id into new.role_id from public.roles where name = v_name;
    end if;
  end if;

  select name into new.role from public.roles where id = new.role_id;

  return new;
end
$$;

revoke all on function private.sync_profile_role()     from public;
revoke all on function private.role_name_from_text(text) from public;

drop trigger if exists profiles_sync_role on public.profiles;

create trigger profiles_sync_role
  before insert or update of role, role_id on public.profiles
  for each row execute function private.sync_profile_role();

-- ---------------------------------------------------------------------
-- 6) role_id obligatorio
-- ---------------------------------------------------------------------
alter table public.profiles alter column role_id set not null;

-- ---------------------------------------------------------------------
-- 7) Verificación final
-- ---------------------------------------------------------------------
do $$
declare
  v_mismatch int;
begin
  select count(*) into v_mismatch
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.role is distinct from r.name;

  if v_mismatch > 0 then
    raise exception '% perfiles con role distinto de role_id tras la migración', v_mismatch;
  end if;

  raise notice 'Roles OK: % perfiles, todos con role_id', (select count(*) from public.profiles);
end
$$;

commit;
