-- =========================================================
-- FASE 0 · PASO 2 · CERRAR EL ACCESO A DATOS PERSONALES
--
-- Qué hace:
--   A. Verifica que la base de datos esté como esperamos.
--      Si algo no coincide, se DETIENE sin cambiar nada.
--   B. Respalda las reglas y permisos actuales
--      (esquema fase0_respaldo), para poder revertir.
--   C. Quita TODO acceso de visitantes anónimos a:
--        profiles, servers, assignments, service_assignments,
--        assignment_checklist, service_teams, service_plans
--   D. Con sesión iniciada:
--        - Cada persona ve solo su perfil, sus asignaciones,
--          su checklist, y los equipos/servicios donde sirve.
--        - El equipo directivo (admin, pastor, coordinador,
--          líder de ministerio) ve todo lo de estas tablas.
--        - Una persona solo puede responder su asignación
--          (confirmar / pedir cambio) y marcar su checklist.
--        - Nadie puede modificar perfiles desde el navegador.
--   E. La app del servidor (llave maestra) no se ve afectada.
--
-- Todo ocurre en una sola transacción: o se aplica completo
-- o no se aplica nada.
--
-- Para revertir: 04_reversa.sql
-- =========================================================

begin;

-- =========================================================
-- A. VERIFICACIONES PREVIAS
-- =========================================================

do $$
declare
  v_tabla text;
  v_tablas text[] := array[
    'profiles', 'servers', 'assignments', 'service_assignments',
    'assignment_checklist', 'service_teams', 'service_plans',
    'roles', 'role_permissions', 'permissions'
  ];
  v_col record;
  v_trigger record;
begin
  -- No ejecutar dos veces (protege el respaldo original).
  if exists (
    select 1 from pg_namespace where nspname = 'fase0_respaldo'
  ) then
    raise exception
      'La Fase 0 ya se aplicó antes (existe el esquema fase0_respaldo). '
      'No se cambió nada.';
  end if;

  -- Todas las tablas existen.
  foreach v_tabla in array v_tablas loop
    if to_regclass('public.' || v_tabla) is null then
      raise exception 'No existe la tabla public.%. No se cambió nada.', v_tabla;
    end if;
  end loop;

  -- Las columnas que usan las reglas existen y son UUID.
  for v_col in
    select *
    from (values
      ('profiles', 'id'),
      ('profiles', 'auth_user_id'),
      ('profiles', 'role_id'),
      ('assignments', 'id'),
      ('assignments', 'profile_id'),
      ('assignments', 'team_id'),
      ('assignments', 'service_plan_id'),
      ('service_assignments', 'profile_id'),
      ('service_assignments', 'team_id'),
      ('service_assignments', 'service_plan_id'),
      ('assignment_checklist', 'assignment_id'),
      ('service_teams', 'id'),
      ('service_plans', 'id'),
      ('role_permissions', 'role_id'),
      ('role_permissions', 'permission_id'),
      ('permissions', 'id')
    ) as esperado(tabla, columna)
  loop
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = v_col.tabla
        and c.column_name = v_col.columna
        and c.data_type = 'uuid'
    ) then
      raise exception
        'La columna public.%.% no existe o no es UUID. No se cambió nada.',
        v_col.tabla, v_col.columna;
    end if;
  end loop;

  -- Ninguna tabla tiene FORCE ROW LEVEL SECURITY
  -- (rompería las funciones auxiliares).
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(v_tablas)
      and c.relforcerowsecurity
  ) then
    raise exception
      'Alguna tabla tiene FORCE ROW LEVEL SECURITY. No se cambió nada.';
  end if;

  -- Quien ejecuta debe poder leer sin RLS (normalmente "postgres").
  if not exists (
    select 1 from pg_roles
    where rolname = current_user
      and (rolbypassrls or rolsuper)
  ) then
    raise exception
      'El usuario % no puede omitir RLS; ejecuta desde el SQL Editor de Supabase. No se cambió nada.',
      current_user;
  end if;

  -- Los triggers del registro de cuentas deben ser SECURITY DEFINER.
  -- Si no, al activar RLS podría fallar el registro de personas nuevas.
  for v_trigger in
    select t.tgname, p.proname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and not p.prosecdef
  loop
    raise exception
      'El trigger % (función %) sobre auth.users no es SECURITY DEFINER; '
      'activar RLS podría romper el registro. No se cambió nada.',
      v_trigger.tgname, v_trigger.proname;
  end loop;
end
$$;

-- =========================================================
-- B. RESPALDO DEL ESTADO ACTUAL
-- =========================================================

create schema fase0_respaldo;
revoke all on schema fase0_respaldo from public, anon, authenticated;

create table fase0_respaldo.politicas as
select now() as respaldado_en, p.*
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (
    'profiles', 'servers', 'assignments', 'service_assignments',
    'assignment_checklist', 'service_teams', 'service_plans'
  );

create table fase0_respaldo.rls_estado as
select now() as respaldado_en, c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'servers', 'assignments', 'service_assignments',
    'assignment_checklist', 'service_teams', 'service_plans'
  );

create table fase0_respaldo.permisos_tabla as
select now() as respaldado_en, g.grantee, g.table_name, g.privilege_type
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.grantee in ('anon', 'authenticated')
  and g.table_name in (
    'profiles', 'servers', 'assignments', 'service_assignments',
    'assignment_checklist', 'service_teams', 'service_plans'
  );

-- =========================================================
-- C. FUNCIONES AUXILIARES (esquema privado, no expuesto en la API)
--
-- SECURITY DEFINER: leen profiles/permisos sin pasar por RLS,
-- lo que evita recursión y mantiene las reglas sencillas.
-- =========================================================

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

-- Perfil activo de la cuenta con sesión.
create or replace function app_private.mi_perfil_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.is_active = true
  limit 1
$$;

-- ¿La cuenta con sesión tiene alguno de estos permisos?
create or replace function app_private.tiene_permiso(p_permisos text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions pe on pe.id = rp.permission_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and pe.name = any(p_permisos)
  )
$$;

-- Equipo directivo: quien entra a /admin, /coordinacion,
-- /pastor o /mi-ministerio.
create or replace function app_private.es_directivo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.tiene_permiso(array[
    'dashboard.view',
    'services.view_all',
    'teams.view_all',
    'teams.view_scoped',
    'users.view',
    'users.manage',
    'change_requests.manage',
    'assignments.manage'
  ])
$$;

-- ¿Esta asignación es mía?
create or replace function app_private.es_mi_asignacion(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.assignments a
    where a.id = p_assignment_id
      and a.profile_id = app_private.mi_perfil_id()
  )
$$;

-- ¿Sirvo en este equipo?
create or replace function app_private.estoy_en_equipo(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    where a.team_id = p_team_id
      and a.profile_id = app_private.mi_perfil_id()
  )
  or exists (
    select 1 from public.service_assignments sa
    where sa.team_id = p_team_id
      and sa.profile_id = app_private.mi_perfil_id()
  )
$$;

-- ¿Sirvo en este servicio?
create or replace function app_private.estoy_en_servicio(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    where a.service_plan_id = p_plan_id
      and a.profile_id = app_private.mi_perfil_id()
  )
  or exists (
    select 1 from public.service_assignments sa
    where sa.service_plan_id = p_plan_id
      and sa.profile_id = app_private.mi_perfil_id()
  )
$$;

revoke all on all functions in schema app_private from public;
grant execute on all functions in schema app_private to authenticated;

-- =========================================================
-- D. QUITAR REGLAS ANTERIORES (ya respaldadas)
-- =========================================================

do $$
declare
  v_politica record;
begin
  for v_politica in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'servers', 'assignments', 'service_assignments',
        'assignment_checklist', 'service_teams', 'service_plans'
      )
  loop
    execute format(
      'drop policy %I on public.%I',
      v_politica.policyname,
      v_politica.tablename
    );
  end loop;
end
$$;

-- =========================================================
-- E. ACTIVAR RLS Y AJUSTAR PERMISOS DE TABLA
-- =========================================================

alter table public.profiles             enable row level security;
alter table public.servers              enable row level security;
alter table public.assignments          enable row level security;
alter table public.service_assignments  enable row level security;
alter table public.assignment_checklist enable row level security;
alter table public.service_teams        enable row level security;
alter table public.service_plans        enable row level security;

-- Visitantes anónimos: sin acceso alguno.
revoke all on
  public.profiles, public.servers, public.assignments,
  public.service_assignments, public.assignment_checklist,
  public.service_teams, public.service_plans
from anon;

-- Con sesión: solo lectura, salvo las excepciones de abajo.
revoke insert, update, delete, truncate, references, trigger on
  public.profiles, public.servers, public.assignments,
  public.service_assignments, public.assignment_checklist,
  public.service_teams, public.service_plans
from authenticated;

grant select on
  public.profiles, public.assignments, public.service_assignments,
  public.assignment_checklist, public.service_teams, public.service_plans
to authenticated;

-- "servers" es una tabla antigua: solo la usa el servidor.
revoke all on public.servers from authenticated;

-- Responder la propia asignación: solo estas columnas.
grant update (status, note, updated_at)
  on public.assignments to authenticated;

-- Checklist propio: solo estas columnas.
grant insert (assignment_id, item, completed, completed_at)
  on public.assignment_checklist to authenticated;
grant update (completed, completed_at, updated_at)
  on public.assignment_checklist to authenticated;

-- =========================================================
-- F. NUEVAS REGLAS
-- =========================================================

-- PROFILES: mi perfil, o todos si soy directivo. Sin escritura.
create policy fase0_profiles_leer
  on public.profiles
  for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (select app_private.es_directivo())
  );

-- SERVERS: sin reglas = sin acceso desde el navegador.

-- ASSIGNMENTS: leer las mías o todas si soy directivo.
create policy fase0_assignments_leer
  on public.assignments
  for select
  to authenticated
  using (
    profile_id = (select app_private.mi_perfil_id())
    or (select app_private.es_directivo())
  );

-- ASSIGNMENTS: responder solo las mías (confirmar o pedir cambio).
create policy fase0_assignments_responder
  on public.assignments
  for update
  to authenticated
  using (
    profile_id = (select app_private.mi_perfil_id())
  )
  with check (
    profile_id = (select app_private.mi_perfil_id())
    and status::text in ('confirmed', 'change_requested')
  );

-- SERVICE_ASSIGNMENTS: las mías o todas si soy directivo.
create policy fase0_service_assignments_leer
  on public.service_assignments
  for select
  to authenticated
  using (
    profile_id = (select app_private.mi_perfil_id())
    or (select app_private.es_directivo())
  );

-- ASSIGNMENT_CHECKLIST: el de mis asignaciones.
create policy fase0_checklist_leer
  on public.assignment_checklist
  for select
  to authenticated
  using (
    app_private.es_mi_asignacion(assignment_id)
    or (select app_private.es_directivo())
  );

create policy fase0_checklist_crear
  on public.assignment_checklist
  for insert
  to authenticated
  with check (
    app_private.es_mi_asignacion(assignment_id)
  );

create policy fase0_checklist_marcar
  on public.assignment_checklist
  for update
  to authenticated
  using (
    app_private.es_mi_asignacion(assignment_id)
  )
  with check (
    app_private.es_mi_asignacion(assignment_id)
  );

-- SERVICE_TEAMS: equipos donde sirvo, o todos si soy directivo.
create policy fase0_service_teams_leer
  on public.service_teams
  for select
  to authenticated
  using (
    app_private.estoy_en_equipo(id)
    or (select app_private.es_directivo())
  );

-- SERVICE_PLANS: servicios donde sirvo, o todos si soy directivo.
create policy fase0_service_plans_leer
  on public.service_plans
  for select
  to authenticated
  using (
    app_private.estoy_en_servicio(id)
    or (select app_private.es_directivo())
  );

commit;

-- Si llegaste aquí sin errores, la Fase 0 de RLS quedó aplicada.
-- Ejecuta ahora 03_verificar.sql
