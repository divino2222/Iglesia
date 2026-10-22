-- =====================================================================
-- Fase 0 · Blindaje (aplicada manualmente en Supabase el 2026-10-21)
--   · RLS en TODAS las tablas de public.
--   · BORRA las políticas previas de public y las recrea desde cero.
--   · Sin política = solo service_role (createAdminClient), que ignora RLS.
--   · Staff = admin, coordinator, pastor, ministry_leader, team_leader.
-- Diagnóstico y verificación: supabase/checks/
-- =====================================================================

begin;

-- 0) Funciones auxiliares en un schema no expuesto por la API
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.current_profile_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
     or (p.auth_user_id is null
         and auth.jwt() ->> 'email' is not null
         and lower(p.email) = lower(auth.jwt() ->> 'email'))
  order by (p.auth_user_id = auth.uid()) desc nulls last
  limit 1
$$;

create or replace function private.current_role_name()
returns text
language sql stable security definer
set search_path = ''
as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = private.current_profile_id()
$$;

create or replace function private.is_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(private.current_role_name() in
    ('admin','coordinator','pastor','ministry_leader','team_leader'), false)
$$;

create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(private.current_role_name() in ('admin','coordinator'), false)
$$;

revoke all on function private.current_profile_id() from public;
revoke all on function private.current_role_name()  from public;
revoke all on function private.is_staff()            from public;
revoke all on function private.is_admin()            from public;
grant execute on function private.current_profile_id() to anon, authenticated;
grant execute on function private.current_role_name()  to anon, authenticated;
grant execute on function private.is_staff()            to anon, authenticated;
grant execute on function private.is_admin()            to anon, authenticated;

-- 1) RLS en todo public + limpieza de políticas previas
do $$
declare t record; p record;
begin
  for t in
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;

  for p in select tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2) Contenido público
create policy "lectura publica" on public.church_info
  for select to anon, authenticated using (true);
create policy "lectura publica" on public.events
  for select to anon, authenticated using (true);
create policy "lectura publica" on public.sermons
  for select to anon, authenticated using (true);
create policy "lectura publica" on public.ministries
  for select to anon, authenticated using (true);
create policy "lectura publica activos" on public.announcements
  for select to anon, authenticated
  using (is_active = true or (select private.is_staff()));
create policy "lectura autenticados" on public.roles
  for select to authenticated using (true);

-- 3) Formularios públicos: insertar sí, leer no (solo staff)
create policy "enviar formulario" on public.contact_messages
  for insert to anon, authenticated with check (true);
create policy "staff lee" on public.contact_messages
  for select to authenticated using ((select private.is_staff()));

create policy "enviar peticion" on public.prayer_requests
  for insert to anon, authenticated with check (true);
create policy "staff lee" on public.prayer_requests
  for select to authenticated using ((select private.is_staff()));

-- 4) Perfiles: el propio o staff. Escritura solo desde el servidor.
create policy "propio o staff" on public.profiles
  for select to authenticated
  using (id = (select private.current_profile_id()) or (select private.is_staff()));

-- 5) Servicio
create policy "propias o staff" on public.assignments
  for select to authenticated
  using (profile_id = (select private.current_profile_id()) or (select private.is_staff()));

create policy "responder propias" on public.assignments
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

-- Al responder, el voluntario solo puede tocar estas columnas
revoke update on public.assignments from anon, authenticated;
grant update (status, note, updated_at) on public.assignments to authenticated;

create policy "checklist propio o staff" on public.assignment_checklist
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.assignments a
               where a.id = assignment_checklist.assignment_id
                 and a.profile_id = (select private.current_profile_id()))
  );

create policy "checklist propio insertar" on public.assignment_checklist
  for insert to authenticated
  with check (
    exists (select 1 from public.assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  );

create policy "checklist propio actualizar" on public.assignment_checklist
  for update to authenticated
  using (
    exists (select 1 from public.assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  )
  with check (
    exists (select 1 from public.assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  );

create policy "planes asignados o staff" on public.service_plans
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.assignments a
               where a.service_plan_id = service_plans.id
                 and a.profile_id = (select private.current_profile_id()))
  );

create policy "equipos asignados o staff" on public.service_teams
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.assignments a
               where a.team_id = service_teams.id
                 and a.profile_id = (select private.current_profile_id()))
  );

create policy "staff lee" on public.activity_log
  for select to authenticated using ((select private.is_staff()));

-- 6) Solicitudes para servir
create policy "propias o staff" on public.ministry_requests
  for select to authenticated
  using (auth_user_id = (select auth.uid()) or (select private.is_staff()));

create policy "crear propia pendiente" on public.ministry_requests
  for insert to authenticated
  with check (auth_user_id = (select auth.uid()) and status = 'pending');

-- Sin políticas (solo service_role): push_subscriptions, notification_queue,
-- user_notifications, role_permissions, permissions, service_assignments,
-- servers, media y cualquier otra tabla no listada.

-- 7) Storage: bucket "media" (subir/editar/borrar solo staff)
--    La lectura funciona por URL pública si el bucket es público;
--    no se crea política SELECT para que nadie pueda listar archivos.
drop policy if exists "media subida staff"  on storage.objects;
drop policy if exists "media edicion staff" on storage.objects;
drop policy if exists "media borrado staff" on storage.objects;

create policy "media subida staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_staff()));

create policy "media edicion staff" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select private.is_staff()))
  with check (bucket_id = 'media' and (select private.is_staff()));

create policy "media borrado staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select private.is_staff()));

-- 8) Tablas futuras: que nazcan sin acceso para anon
alter default privileges in schema public revoke all on tables from anon;

commit;
