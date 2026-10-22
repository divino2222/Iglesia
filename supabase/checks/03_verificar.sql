-- =====================================================================
-- 03_verificar.sql  ·  Fase 0 · Comprobación posterior
-- No es una migración: ejecutar a mano en el SQL Editor.
-- Las simulaciones se deshacen con ROLLBACK.
-- =====================================================================

-- 1) Tablas sin RLS (esperado: 0 filas)
select c.relname as tabla_sin_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity;

-- 2) Resumen de políticas por tabla
select c.relname as tabla,
       coalesce(string_agg(p.cmd || ' → ' || p.policyname, ' | ' order by p.cmd),
                '— solo service_role —') as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public' and c.relkind in ('r','p')
group by c.relname
order by c.relname;

-- 3) Escritura abierta peligrosa (esperado: 0 filas)
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE','DELETE','ALL')
  and (qual = 'true' or with_check = 'true');

-- 4) Como visitante anónimo
begin;
set local role anon;
select 'anon · profiles'           as prueba, count(*) from public.profiles;           -- 0
select 'anon · assignments'        as prueba, count(*) from public.assignments;        -- 0
select 'anon · push_subscriptions' as prueba, count(*) from public.push_subscriptions; -- 0
select 'anon · prayer_requests'    as prueba, count(*) from public.prayer_requests;    -- 0
select 'anon · contact_messages'   as prueba, count(*) from public.contact_messages;   -- 0
select 'anon · events'             as prueba, count(*) from public.events;             -- > 0
select 'anon · sermons'            as prueba, count(*) from public.sermons;            -- > 0
rollback;

-- 5) Como voluntario (pon el auth.users.id de alguien con rol "server")
begin;
select set_config('request.jwt.claims',
  json_build_object('sub','00000000-0000-0000-0000-000000000000','role','authenticated')::text, true);
set local role authenticated;
select 'mi perfil'          as prueba, private.current_profile_id()::text as valor;
select 'es staff'           as prueba, private.is_staff()::text as valor;                     -- false
select 'perfiles visibles'  as prueba, count(*)::text from public.profiles;                   -- 1
select 'asignaciones'       as prueba, count(*)::text from public.assignments;                -- solo suyas
select 'planes visibles'    as prueba, count(*)::text from public.service_plans;              -- solo asignados
select 'activity_log'       as prueba, count(*)::text from public.activity_log;               -- 0
select 'push_subscriptions' as prueba, count(*)::text from public.push_subscriptions;         -- 0
rollback;

-- 6) Como staff (pon el auth.users.id de un admin/coordinator)
begin;
select set_config('request.jwt.claims',
  json_build_object('sub','00000000-0000-0000-0000-000000000000','role','authenticated')::text, true);
set local role authenticated;
select 'es staff'          as prueba, private.is_staff()::text as valor;   -- true
select 'perfiles visibles' as prueba, count(*)::text from public.profiles;      -- todos
select 'service_plans'     as prueba, count(*)::text from public.service_plans; -- todos
rollback;

-- 7) Columnas actualizables en assignments (esperado: note, status, updated_at)
select column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'assignments'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
order by column_name;

-- 8) Políticas de Storage
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
