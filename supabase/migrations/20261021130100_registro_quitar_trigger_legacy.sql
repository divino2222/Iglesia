-- =====================================================================
-- Registro · Quitar el trigger viejo de perfiles en auth.users
--
-- Había un trigger creado a mano (no versionado) que inserta en
-- public.profiles con rol "new_volunteer" antes que el nuestro, así que
-- create_member_profile() nunca llegaba a crear el perfil "member".
--
-- Borra todo trigger de auth.users cuya función escriba en profiles,
-- excepto on_auth_user_created_profile. Muestra en el resultado cuáles
-- borró. Requiere la migración 20261021130000.
-- =====================================================================

begin;

do $$
begin
  if to_regprocedure('private.create_member_profile()') is null then
    raise exception 'Primero ejecuta 20261021130000_registro_perfil_member.sql';
  end if;
end
$$;

create temporary table _triggers_borrados (
  trigger_name text,
  function_name text
);

do $$
declare
  t record;
begin
  for t in
    select tg.tgname, p.oid::regprocedure::text as fn
    from pg_trigger tg
    join pg_proc p on p.oid = tg.tgfoid
    where tg.tgrelid = 'auth.users'::regclass
      and not tg.tgisinternal
      and tg.tgname <> 'on_auth_user_created_profile'
      and p.prosrc ilike '%profiles%'
  loop
    execute format('drop trigger %I on auth.users', t.tgname);
    insert into _triggers_borrados values (t.tgname, t.fn);
  end loop;
end
$$;

commit;

-- Si no aparece ninguna fila, no había trigger viejo
select * from _triggers_borrados;
