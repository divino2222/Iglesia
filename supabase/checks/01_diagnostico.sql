-- =====================================================================
-- 01_diagnostico.sql  ·  Fase 0 · Solo lectura (no modifica nada)
-- No es una migración: ejecutar a mano en el SQL Editor.
-- =====================================================================

-- 1) Tablas de public: ¿tienen RLS? ¿cuántas políticas?
select
  c.relname as tabla,
  c.relrowsecurity as rls_activo,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
  case
    when not c.relrowsecurity then '🔴 SIN RLS: expuesta a anon/authenticated'
    when (select count(*) from pg_policies p
          where p.schemaname = 'public' and p.tablename = c.relname) = 0
      then '🟢 RLS sin políticas (solo service_role)'
    else '🟡 RLS con políticas: revisar abajo'
  end as estado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relrowsecurity, c.relname;

-- 2) Políticas existentes
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Privilegios de anon / authenticated
select table_name, grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 4) Vistas (sin security_invoker se saltan RLS)
select c.relname as vista,
       case when c.reloptions::text ilike '%security_invoker=true%'
            then '🟢 security_invoker' else '🔴 salta RLS' end as estado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm');

-- 5) Funciones SECURITY DEFINER expuestas vía /rpc
select p.proname as funcion,
       pg_get_function_identity_arguments(p.oid) as argumentos
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;

-- 6) Columnas que necesita la migración de RLS (deben salir TODAS en verde)
with esperadas(tabla, columna) as (values
  ('profiles','id'), ('profiles','auth_user_id'), ('profiles','email'), ('profiles','role_id'),
  ('roles','id'), ('roles','name'),
  ('assignments','profile_id'), ('assignments','service_plan_id'), ('assignments','team_id'),
  ('assignments','status'), ('assignments','note'), ('assignments','updated_at'),
  ('assignment_checklist','assignment_id'),
  ('ministry_requests','auth_user_id'), ('ministry_requests','status'),
  ('announcements','is_active')
)
select e.tabla, e.columna,
       case when c.column_name is null then '🔴 FALTA' else '🟢 ok' end as estado
from esperadas e
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = e.tabla and c.column_name = e.columna
order by estado desc, e.tabla, e.columna;

-- 7) Perfiles sin vincular a auth.users
select count(*) filter (where auth_user_id is null) as sin_auth_user_id,
       count(*) as total_perfiles
from public.profiles;

-- 8) Buckets y políticas de Storage
select id, name, public from storage.buckets order by name;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
