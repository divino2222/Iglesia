-- =====================================================================
-- Núcleo · Paso 3 · assignments → service_assignments
--
--   · Las filas que solo existen en assignments se copian a
--     service_assignments conservando su id.
--   · En las filas duplicadas (mismo plan, equipo y persona) gana el
--     status/note con updated_at más reciente.
--   · assignment_checklist pasa a apuntar a service_assignments.
--   · Las políticas RLS se mueven a service_assignments.
--   · assignments se renombra a assignments_legacy y se crea una VISTA
--     de compatibilidad "assignments" (security_invoker) para que el
--     código actual siga funcionando sin redeploy. Se borra en el Paso 6.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0) Verificaciones previas
-- ---------------------------------------------------------------------
do $$
begin
  if (select relkind from pg_class where oid = 'public.assignments'::regclass) <> 'r' then
    raise exception 'public.assignments no es una tabla (¿la migración ya se aplicó?)';
  end if;

  -- La restricción única que usa el upsert de reemplazos debe existir
  if not exists (
    select 1
    from pg_index i
    where i.indrelid = 'public.service_assignments'::regclass
      and i.indisunique
      and (select array_agg(a.attname::text order by a.attname)
           from pg_attribute a
           where a.attrelid = i.indrelid and a.attnum = any (i.indkey))
          = array['profile_id', 'service_plan_id', 'team_id']
  ) then
    raise exception 'service_assignments no tiene la restricción única (service_plan_id, team_id, profile_id)';
  end if;

  -- Ids de filas no duplicadas que ya existan en service_assignments
  if exists (
    select 1
    from public.assignments a
    join public.service_assignments s on s.id = a.id
    where not (s.service_plan_id = a.service_plan_id
               and s.team_id = a.team_id
               and s.profile_id = a.profile_id)
  ) then
    raise exception 'Hay ids de assignments que ya usa otra fila de service_assignments';
  end if;

  -- Toda persona de assignments debe existir en profiles
  if exists (
    select 1 from public.assignments a
    where not exists (select 1 from public.profiles p where p.id = a.profile_id)
  ) then
    raise exception 'Hay assignments cuyo profile_id no existe en profiles';
  end if;
end
$$;

-- Detalle de las filas duplicadas y qué estado va a ganar
select a.id as id_assignments, s.id as id_service_assignments,
       a.status as status_assignments, s.status as status_service_assignments,
       a.updated_at as upd_assignments, s.updated_at as upd_service_assignments,
       case when coalesce(a.updated_at, '-infinity') > coalesce(s.updated_at, '-infinity')
            then 'gana assignments' else 'se queda service_assignments' end as decision
from public.assignments a
join public.service_assignments s
  on s.service_plan_id = a.service_plan_id
 and s.team_id = a.team_id
 and s.profile_id = a.profile_id;

-- ---------------------------------------------------------------------
-- 1) Soltar la FK de assignment_checklist → assignments
-- ---------------------------------------------------------------------
do $$
declare
  v_con text;
begin
  for v_con in
    select conname from pg_constraint
    where conrelid = 'public.assignment_checklist'::regclass
      and confrelid = 'public.assignments'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.assignment_checklist drop constraint %I', v_con);
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- 2) Filas duplicadas: gana la más reciente
-- ---------------------------------------------------------------------
update public.service_assignments s
set status       = a.status,
    note         = a.note,
    updated_at   = a.updated_at,
    confirmed_at = case
                     when a.status = 'confirmed' and s.confirmed_at is null then a.updated_at
                     else s.confirmed_at
                   end
from public.assignments a
where s.service_plan_id = a.service_plan_id
  and s.team_id = a.team_id
  and s.profile_id = a.profile_id
  and coalesce(a.updated_at, '-infinity') > coalesce(s.updated_at, '-infinity');

-- El checklist de las duplicadas pasa al id de service_assignments
update public.assignment_checklist c
set assignment_id = s.id
from public.assignments a
join public.service_assignments s
  on s.service_plan_id = a.service_plan_id
 and s.team_id = a.team_id
 and s.profile_id = a.profile_id
where c.assignment_id = a.id
  and a.id <> s.id;

-- ---------------------------------------------------------------------
-- 3) Copiar las filas que solo existen en assignments (mismo id)
-- ---------------------------------------------------------------------
insert into public.service_assignments
  (id, service_plan_id, team_id, profile_id, role, status, note,
   confirmed_at, created_at, updated_at)
select
  a.id, a.service_plan_id, a.team_id, a.profile_id, 'integrante', a.status, a.note,
  case when a.status = 'confirmed' then a.updated_at end,
  coalesce((to_jsonb(a) ->> 'created_at')::timestamptz, a.updated_at, now()),
  coalesce(a.updated_at, now())
from public.assignments a
where not exists (
  select 1 from public.service_assignments s
  where s.service_plan_id = a.service_plan_id
    and s.team_id = a.team_id
    and s.profile_id = a.profile_id
);

-- ---------------------------------------------------------------------
-- 4) Nueva FK del checklist (falla si queda algún checklist huérfano)
-- ---------------------------------------------------------------------
alter table public.assignment_checklist
  drop constraint if exists assignment_checklist_assignment_id_fkey;

alter table public.assignment_checklist
  add constraint assignment_checklist_assignment_id_fkey
  foreign key (assignment_id) references public.service_assignments (id)
  on delete cascade;

-- ---------------------------------------------------------------------
-- 5) Verificación (sin estado: se puede ejecutar sola o repetir)
--    · Ninguna fila de assignments quedó sin su equivalente.
--    · Ningún checklist quedó huérfano (la FK del paso 4 ya lo exige).
-- ---------------------------------------------------------------------
do $$
declare
  v_missing int;
  v_orphan  int;
begin
  select count(*) into v_missing
  from public.assignments a
  where not exists (
    select 1 from public.service_assignments s
    where s.service_plan_id = a.service_plan_id
      and s.team_id = a.team_id
      and s.profile_id = a.profile_id
  );

  if v_missing > 0 then
    raise exception '% filas de assignments no llegaron a service_assignments', v_missing;
  end if;

  select count(*) into v_orphan
  from public.assignment_checklist c
  where not exists (select 1 from public.service_assignments s where s.id = c.assignment_id);

  if v_orphan > 0 then
    raise exception '% filas de assignment_checklist sin asignación', v_orphan;
  end if;

  raise notice 'service_assignments: % filas, todas las de assignments incluidas',
    (select count(*) from public.service_assignments);
end
$$;

-- ---------------------------------------------------------------------
-- 6) updated_at automático en service_assignments
-- ---------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists service_assignments_set_updated_at on public.service_assignments;

create trigger service_assignments_set_updated_at
  before update on public.service_assignments
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- 7) RLS: las políticas de assignments pasan a service_assignments
--    (las que referencian la tabla vieja se recrean; si no, seguirían
--     apuntando a assignments_legacy tras el renombre)
-- ---------------------------------------------------------------------
drop policy if exists "propias o staff"   on public.assignments;
drop policy if exists "responder propias" on public.assignments;

drop policy if exists "propias o staff"   on public.service_assignments;
drop policy if exists "responder propias" on public.service_assignments;

create policy "propias o staff" on public.service_assignments
  for select to authenticated
  using (profile_id = (select private.current_profile_id()) or (select private.is_staff()));

create policy "responder propias" on public.service_assignments
  for update to authenticated
  using (profile_id = (select private.current_profile_id()))
  with check (profile_id = (select private.current_profile_id()));

revoke insert, update, delete on public.service_assignments from anon, authenticated;
grant update (status, note, updated_at) on public.service_assignments to authenticated;

drop policy if exists "checklist propio o staff"    on public.assignment_checklist;
drop policy if exists "checklist propio insertar"   on public.assignment_checklist;
drop policy if exists "checklist propio actualizar" on public.assignment_checklist;

create policy "checklist propio o staff" on public.assignment_checklist
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.service_assignments a
               where a.id = assignment_checklist.assignment_id
                 and a.profile_id = (select private.current_profile_id()))
  );

create policy "checklist propio insertar" on public.assignment_checklist
  for insert to authenticated
  with check (
    exists (select 1 from public.service_assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  );

create policy "checklist propio actualizar" on public.assignment_checklist
  for update to authenticated
  using (
    exists (select 1 from public.service_assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  )
  with check (
    exists (select 1 from public.service_assignments a
            where a.id = assignment_checklist.assignment_id
              and a.profile_id = (select private.current_profile_id()))
  );

drop policy if exists "planes asignados o staff" on public.service_plans;

create policy "planes asignados o staff" on public.service_plans
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.service_assignments a
               where a.service_plan_id = service_plans.id
                 and a.profile_id = (select private.current_profile_id()))
  );

drop policy if exists "equipos asignados o staff" on public.service_teams;

create policy "equipos asignados o staff" on public.service_teams
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.service_assignments a
               where a.team_id = service_teams.id
                 and a.profile_id = (select private.current_profile_id()))
  );

-- ---------------------------------------------------------------------
-- 8) Retirar assignments y crear la vista de compatibilidad
-- ---------------------------------------------------------------------
alter table public.assignments rename to assignments_legacy;
revoke all on public.assignments_legacy from anon, authenticated;

create view public.assignments
with (security_invoker = true)
as
select id, service_plan_id, team_id, profile_id, status, note, created_at, updated_at
from public.service_assignments;

revoke all on public.assignments from anon, authenticated;
grant select on public.assignments to authenticated;
grant update (status, note, updated_at) on public.assignments to authenticated;
grant select, insert, update, delete on public.assignments to service_role;

notify pgrst, 'reload schema';

commit;
