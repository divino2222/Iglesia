-- =========================================================
-- FASE 0 · PASO 1 · DIAGNÓSTICO (SOLO LECTURA)
--
-- No modifica nada. Devuelve una sola tabla con:
--   1. Estado de RLS de las tablas que vamos a proteger
--   2. Reglas (policies) actuales
--   3. Tipos de columnas clave
--   4. Triggers sobre auth.users (registro de cuentas)
--   5. Vistas que dependen de estas tablas
--   6. Los perfiles con rol, con correo y sin cuenta vinculada
--   7. Permisos asignados a cada rol
--
-- Correos parcialmente ocultos y solo el primer nombre.
-- Copia el resultado completo y compártelo.
-- =========================================================

with tablas(t) as (
  values
    ('profiles'),
    ('servers'),
    ('assignments'),
    ('service_assignments'),
    ('assignment_checklist'),
    ('service_teams'),
    ('service_plans')
)
select orden, seccion, detalle
from (
  -- 1. RLS
  select
    1 as orden,
    'rls'::text as seccion,
    c.relname
      || ' | rls=' || c.relrowsecurity
      || ' | force=' || c.relforcerowsecurity
      || ' | dueño=' || pg_get_userbyid(c.relowner) as detalle
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (select t from tablas)

  union all

  -- 2. Reglas actuales
  select
    2,
    'politica',
    p.tablename
      || ' | ' || p.policyname
      || ' | ' || p.cmd
      || ' | roles=' || array_to_string(p.roles, ',')
      || ' | using=' || coalesce(p.qual, '-')
      || ' | check=' || coalesce(p.with_check, '-')
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in (select t from tablas)

  union all

  -- 3. Tipos de columnas
  select
    3,
    'tipo_columna',
    c.table_name || '.' || c.column_name || ' = ' || c.data_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and (
      (
        c.table_name in (select t from tablas)
        and c.column_name in (
          'id', 'auth_user_id', 'profile_id', 'team_id',
          'service_plan_id', 'assignment_id', 'role_id',
          'status', 'is_active'
        )
      )
      or c.table_name = 'role_permissions'
      or (c.table_name = 'permissions' and c.column_name in ('id', 'name'))
    )

  union all

  -- 4. Triggers del registro de cuentas
  select
    4,
    'trigger_auth',
    t.tgname
      || ' -> ' || p.proname
      || ' | security_definer=' || p.prosecdef
      || ' | dueño=' || pg_get_userbyid(p.proowner)
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  where t.tgrelid = 'auth.users'::regclass
    and not t.tgisinternal

  union all

  -- 5. Vistas dependientes
  select distinct
    5,
    'vista_dependiente',
    v.view_schema || '.' || v.view_name || ' usa ' || v.table_name
  from information_schema.view_table_usage v
  where v.table_schema = 'public'
    and v.table_name in (select t from tablas)

  union all

  -- 6. Perfiles con rol, con correo y sin cuenta vinculada
  select
    6,
    'perfil_sin_cuenta',
    format(
      '%s | rol=%s | rol_antiguo=%s | correo=%s | existe_cuenta_con_ese_correo=%s | cuenta_ya_vinculada_a_otro_perfil=%s | cuenta_creada=%s | ultimo_acceso=%s | perfil_creado=%s',
      split_part(p.full_name, ' ', 1),
      coalesce(r.name, '-'),
      coalesce(p.role, '-'),
      regexp_replace(p.email, '^(.).*@', '\1***@'),
      (u.id is not null),
      exists (
        select 1 from public.profiles p2
        where p2.auth_user_id = u.id
      ),
      coalesce(u.created_at::date::text, '-'),
      coalesce(u.last_sign_in_at::date::text, '-'),
      coalesce(p.created_at::date::text, '-')
    )
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  left join auth.users u on lower(u.email) = lower(p.email)
  where p.role_id is not null
    and p.auth_user_id is null
    and p.email is not null

  union all

  -- 7. Permisos por rol
  select
    7,
    'permisos_rol',
    r.name || ': ' || string_agg(pe.name, ', ' order by pe.name)
  from public.roles r
  join public.role_permissions rp on rp.role_id = r.id
  join public.permissions pe on pe.id = rp.permission_id
  group by r.name
) resultado
order by orden, detalle;
