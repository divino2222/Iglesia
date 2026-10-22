-- =====================================================================
-- Núcleo · Paso 2 · servers → profiles
--
--   · Cada fila de servers queda vinculada a un perfil:
--       1. por auth_user_id,
--       2. por email (y el perfil hereda el auth_user_id del server),
--       3. si no existe, se crea el perfil con rol "server".
--   · En los perfiles vinculados solo se rellenan datos vacíos
--     (teléfono, foto, ministerios); nunca se pisan datos existentes.
--   · servers se renombra a servers_legacy (se borra en el Paso 6).
--   · profiles.auth_user_id pasa a ser único.
--
-- Requiere el Paso 1 (trigger de roles) y el código que ya no escribe en
-- servers (coordinacion/servir/solicitudes y api/push/test-user).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0) Verificaciones previas
-- ---------------------------------------------------------------------
do $$
declare
  v_fks text;
begin
  if (select relkind from pg_class where oid = 'public.servers'::regclass) <> 'r' then
    raise exception 'public.servers no es una tabla';
  end if;

  -- Ninguna otra tabla debe depender de servers.id
  select string_agg(conrelid::regclass::text || '.' || conname, ', ')
  into v_fks
  from pg_constraint
  where confrelid = 'public.servers'::regclass and contype = 'f';

  if v_fks is not null then
    raise exception 'Hay FKs que apuntan a servers: %. Revisar antes de migrar.', v_fks;
  end if;

  -- Un server no puede coincidir por email con varios perfiles
  if exists (
    select s.id
    from public.servers s
    join public.profiles p on lower(p.email) = lower(s.email)
    where s.email is not null
    group by s.id
    having count(*) > 1
  ) then
    raise exception 'Hay servers cuyo email coincide con más de un perfil';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 1) Vincular y crear perfiles
-- ---------------------------------------------------------------------
create temporary table _server_map (
  server_id  uuid primary key,
  profile_id uuid not null,
  via        text not null
) on commit drop;

do $$
declare
  s          record;
  v_profile  uuid;
begin
  for s in select * from public.servers order by full_name loop
    v_profile := null;

    -- 1. Por auth_user_id
    if s.auth_user_id is not null then
      select id into v_profile from public.profiles where auth_user_id = s.auth_user_id;

      if v_profile is not null then
        insert into _server_map values (s.id, v_profile, 'auth_user_id');
      end if;
    end if;

    -- 2. Por email
    if v_profile is null and s.email is not null then
      select id into v_profile from public.profiles where lower(email) = lower(s.email);

      if v_profile is not null then
        update public.profiles
        set auth_user_id = coalesce(auth_user_id, s.auth_user_id)
        where id = v_profile;

        insert into _server_map values (s.id, v_profile, 'email');
      end if;
    end if;

    -- 3. Crear perfil
    if v_profile is null then
      insert into public.profiles
        (full_name, email, phone, photo_url, ministries, is_active, auth_user_id, role)
      values
        (s.full_name, s.email, s.phone, s.photo_url, s.ministries,
         coalesce(s.is_active, true), s.auth_user_id, 'server')
      returning id into v_profile;

      insert into _server_map values (s.id, v_profile, 'nuevo');
    end if;

    -- Rellenar solo lo vacío
    update public.profiles p
    set phone      = coalesce(p.phone, s.phone),
        photo_url  = coalesce(p.photo_url, s.photo_url),
        ministries = case
                       -- funciona igual si ministries es text[] o jsonb
                       when p.ministries is null
                         or p.ministries::text in ('{}', '[]') then s.ministries
                       else p.ministries
                     end
    where p.id = v_profile;
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- 2) Verificación: todos los servers tienen perfil
-- ---------------------------------------------------------------------
do $$
declare
  v_servers int := (select count(*) from public.servers);
  v_mapped  int := (select count(*) from _server_map);
begin
  if v_servers <> v_mapped then
    raise exception 'Solo % de % servers quedaron vinculados', v_mapped, v_servers;
  end if;

  raise notice 'servers vinculados: % por auth_user_id, % por email, % perfiles nuevos',
    (select count(*) from _server_map where via = 'auth_user_id'),
    (select count(*) from _server_map where via = 'email'),
    (select count(*) from _server_map where via = 'nuevo');
end
$$;

-- Detalle para revisar en el resultado del SQL Editor
select s.full_name, s.email, m.via, m.profile_id
from _server_map m
join public.servers s on s.id = m.server_id
order by m.via, s.full_name;

-- ---------------------------------------------------------------------
-- 3) auth_user_id único en profiles
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select auth_user_id from public.profiles
    where auth_user_id is not null
    group by auth_user_id having count(*) > 1
  ) then
    raise exception 'Hay perfiles que comparten auth_user_id; resolver antes de continuar';
  end if;
end
$$;

create unique index if not exists profiles_auth_user_id_key
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

-- ---------------------------------------------------------------------
-- 4) Retirar servers
-- ---------------------------------------------------------------------
alter table public.servers rename to servers_legacy;
revoke all on public.servers_legacy from anon, authenticated;

notify pgrst, 'reload schema';

commit;
