import Link from "next/link";
import { formatAppDateLong } from "@/lib/date-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServingAdminData } from "@/lib/serving-admin";
import {
  createNextSundayPlan,
  keepAssignmentPending,
  linkProfileAccount,
  reassignAssignment,
  resolveAssignmentChange,
  updateServicePlan,
  updateServiceTeam,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    pin?: string;
    plan?: string;
  }>;
};

function getStatusLabel(status: string) {
  if (status === "ready") return "Confirmado";
  if (status === "attention") return "Revisar";
  return "Por confirmar";
}

function getStatusClass(status: string) {
  if (status === "ready") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "attention") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getResponseLabel(status?: string) {
  if (status === "confirmed") return "Confirmó";
  if (status === "change_requested") return "Cambio solicitado";
  return "Pendiente";
}

function getResponseClass(status?: string) {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "change_requested") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-amber-100 text-amber-700";
}


export default async function AdminServirPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const pin = params?.pin;
  const selectedPlanId = params?.plan;
  const validPin = process.env.SERVING_ADMIN_PIN;

  if (!validPin || pin !== validPin) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Panel privado
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-stone-950">
            Acceso de coordinador
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Agrega el PIN al final de la URL para entrar.
          </p>

          <div className="mt-4 rounded-2xl bg-stone-100 p-3 text-sm text-stone-700">
            /admin/servir?pin=TU_PIN
          </div>
        </div>
      </div>
    );
  }

  const {
    plan,
    plans,
    teams,
    profiles,
    assignments,
    assignmentChecklist,
  } = await getServingAdminData(selectedPlanId);

  /*
   * Las cuentas de Supabase Auth se leen exclusivamente
   * desde servidor usando Service Role.
   */
  const admin = createAdminClient();

  const {
    data: { users: authUsers },
    error: authUsersError,
  } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const safeAuthUsers = authUsersError ? [] : authUsers;

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            No hay plan de servicio creado todavía.
          </p>
        </div>
      </div>
    );
  }

  const readyTeams = teams.filter(
    (team) => team.status === "ready"
  ).length;

  const pendingTeams = teams.filter(
    (team) => team.status === "pending"
  ).length;

  const attentionTeams = teams.filter(
    (team) => team.status === "attention"
  ).length;

  const confirmedCount = assignments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const changeRequestedCount = assignments.filter(
    (item) => item.status === "change_requested"
  ).length;

  const pendingResponseCount = assignments.filter(
    (item) => item.status === "pending"
  ).length;

  const totalServers = assignments.length;

  const profileById = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  const assignmentsByTeam = new Map<string, typeof assignments>();

  assignments.forEach((assignment) => {
    const current = assignmentsByTeam.get(assignment.team_id) ?? [];

    current.push(assignment);

    assignmentsByTeam.set(assignment.team_id, current);
  });

  const checklistByAssignment = new Map<
    string,
    typeof assignmentChecklist
  >();

  assignmentChecklist.forEach((item) => {
    const current = checklistByAssignment.get(item.assignment_id) ?? [];

    current.push(item);

    checklistByAssignment.set(item.assignment_id, current);
  });

  const teamById = new Map(
    teams.map((team) => [team.id, team])
  );

  const readyToServeCount = assignments.filter((assignment) => {
    if (assignment.status !== "confirmed") {
      return false;
    }

    const team = teamById.get(assignment.team_id);
    const checklistTotal = team?.checklist?.length ?? 0;

    if (checklistTotal === 0) {
      return false;
    }

    const progress = checklistByAssignment.get(assignment.id) ?? [];
    const completedCount = progress.filter((item) => item.completed).length;

    return completedCount === checklistTotal;
  }).length;

  const pendingAssignments = assignments.filter(
    (assignment) => assignment.status === "pending"
  );

  const changeRequestedAssignments = assignments.filter(
    (assignment) => assignment.status === "change_requested"
  );

  const readyAssignments = assignments.filter((assignment) => {
    if (assignment.status !== "confirmed") {
      return false;
    }

    const team = teamById.get(assignment.team_id);
    const checklistTotal = team?.checklist?.length ?? 0;
    if (checklistTotal === 0) return false;

    const progress = checklistByAssignment.get(assignment.id) ?? [];
    const completedCount = progress.filter((item) => item.completed).length;

    return completedCount === checklistTotal;
  });

  const confirmedNotReadyAssignments = assignments.filter((assignment) => {
    if (assignment.status !== "confirmed") {
      return false;
    }

    const team = teamById.get(assignment.team_id);
    const checklistTotal = team?.checklist?.length ?? 0;
    const progress = checklistByAssignment.get(assignment.id) ?? [];
    const completedCount = progress.filter((item) => item.completed).length;

    return checklistTotal === 0 || completedCount < checklistTotal;
  });

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* =====================================================
            ENCABEZADO + ESTADÍSTICAS
        ====================================================== */}

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Panel privado
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-stone-950">
            Administrar servidores
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Editando:{" "}
            <span className="font-semibold text-stone-950">
              {formatAppDateLong(plan.service_date)}
            </span>
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {readyTeams}
              </p>

              <p className="text-[11px] font-semibold text-emerald-700">
                Listos
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">
                {pendingTeams}
              </p>

              <p className="text-[11px] font-semibold text-amber-700">
                Pendientes
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <p className="text-xl font-bold text-red-700">
                {attentionTeams}
              </p>

              <p className="text-[11px] font-semibold text-red-700">
                Revisar
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Link
              href="#confirmaron"
              className="rounded-2xl bg-emerald-50 p-3 text-center transition hover:bg-emerald-100"
            >
              <p className="text-xl font-bold text-emerald-700">
                {confirmedCount}
              </p>

              <p className="text-[11px] font-semibold text-emerald-700">
                Confirmaron
              </p>
            </Link>

            <Link
              href="#sin-responder"
              className="rounded-2xl bg-amber-50 p-3 text-center transition hover:bg-amber-100"
            >
              <p className="text-xl font-bold text-amber-700">
                {pendingResponseCount}
              </p>

              <p className="text-[11px] font-semibold text-amber-700">
                Sin responder
              </p>
            </Link>

            <Link
              href="#pidieron-cambio"
              className="rounded-2xl bg-sky-50 p-3 text-center transition hover:bg-sky-100"
            >
              <p className="text-xl font-bold text-sky-700">
                {changeRequestedCount}
              </p>

              <p className="text-[11px] font-semibold text-sky-700">
                Cambios solicitados
              </p>
            </Link>

            <Link
              href="#listos-para-servir"
              className="rounded-2xl bg-violet-50 p-3 text-center transition hover:bg-violet-100"
            >
              <p className="text-xl font-bold text-violet-700">
                {readyToServeCount}
              </p>

              <p className="text-[11px] font-semibold text-violet-700">
                Listos para servir
              </p>
            </Link>
          </div>
        </section>

        {changeRequestedCount > 0 ? (
          <section className="rounded-[30px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Requiere tu atención
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  {changeRequestedCount === 1
                    ? "Hay 1 solicitud de cambio pendiente"
                    : `Hay ${changeRequestedCount} solicitudes de cambio pendientes`}
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Revisa las solicitudes y decide si mantienes, confirmas o reasignas el servicio.
                </p>
              </div>

              <span className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-white px-3 text-lg font-bold text-sky-700 shadow-sm">
                {changeRequestedCount}
              </span>
            </div>

            <Link
              href="#pidieron-cambio"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Revisar solicitudes
            </Link>
          </section>
        ) : (
          <section className="rounded-[30px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Coordinación al día
            </p>

            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              No hay solicitudes de cambio pendientes
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-600">
              Por ahora no hay respuestas que requieran una decisión inmediata de coordinación.
            </p>
          </section>
        )}

        {/* =====================================================
            ACCIONES RÁPIDAS
        ====================================================== */}

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Acciones rápidas
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Control del domingo
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                {totalServers} servidores · {confirmedCount} confirmados · {readyToServeCount} listos · {changeRequestedCount} {changeRequestedCount === 1 ? "cambio pendiente" : "cambios pendientes"}
              </p>
            </div>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              {formatAppDateLong(plan.service_date)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="#pidieron-cambio"
              className="rounded-[22px] border border-sky-100 bg-sky-50 p-4 transition hover:bg-sky-100"
            >
              <p className="text-xl">🔄</p>
              <p className="mt-2 text-sm font-semibold text-sky-800">
                Resolver cambios
              </p>
              <p className="mt-1 text-xs leading-5 text-sky-700/80">
                {changeRequestedCount} por atender
              </p>
            </Link>

            <Link
              href="#sin-responder"
              className="rounded-[22px] border border-amber-100 bg-amber-50 p-4 transition hover:bg-amber-100"
            >
              <p className="text-xl">⏳</p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                Ver pendientes
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-700/80">
                {pendingResponseCount} sin responder
              </p>
            </Link>

            <Link
              href="#listos-para-servir"
              className="rounded-[22px] border border-violet-100 bg-violet-50 p-4 transition hover:bg-violet-100"
            >
              <p className="text-xl">✅</p>
              <p className="mt-2 text-sm font-semibold text-violet-800">
                Ver listos
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-700/80">
                {readyToServeCount} listos para servir
              </p>
            </Link>

            <Link
              href="#crear-proximo-domingo"
              className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100"
            >
              <p className="text-xl">📅</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                Próximo domingo
              </p>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Crear la siguiente planeación
              </p>
            </Link>
          </div>
        </section>

        {/* =====================================================
            RESUMEN OPERATIVO
        ====================================================== */}

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Centro de control
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            Resumen operativo del domingo
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Lo importante para coordinación, reunido en un solo lugar.
          </p>

          <div className="mt-5 space-y-5">
            <OperationalList
              id="sin-responder"
              title="Sin responder"
              description="Servidores que todavía no han confirmado ni solicitado cambio."
              tone="amber"
              assignments={pendingAssignments}
              profileById={profileById}
              teamById={teamById}
              checklistByAssignment={checklistByAssignment}
            />

            <OperationalList
              id="pidieron-cambio"
              title="Cambios solicitados"
              description="Solicitudes enviadas por servidores que esperan respuesta de coordinación."
              tone="sky"
              assignments={changeRequestedAssignments}
              profileById={profileById}
              teamById={teamById}
              checklistByAssignment={checklistByAssignment}
            />

            <OperationalList
              id="confirmaron"
              title="Confirmaron, aún en preparación"
              description="Ya confirmaron asistencia, pero todavía no terminan su checklist."
              tone="emerald"
              assignments={confirmedNotReadyAssignments}
              profileById={profileById}
              teamById={teamById}
              checklistByAssignment={checklistByAssignment}
            />

            <OperationalList
              id="listos-para-servir"
              title="Listos para servir"
              description="Confirmaron asistencia y completaron el 100% de su preparación."
              tone="violet"
              assignments={readyAssignments}
              profileById={profileById}
              teamById={teamById}
              checklistByAssignment={checklistByAssignment}
            />
          </div>
        </section>

        {/* =====================================================
            HISTORIAL DE SERVICIOS
        ====================================================== */}

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Historial
          </p>

          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Servicios creados
          </h2>

          <div className="mt-4 space-y-2">
            {plans.map((item) => {
              const active = item.id === plan.id;

              return (
                <Link
                  key={item.id}
                  href={`/admin/servir?pin=${encodeURIComponent(
                    pin
                  )}&plan=${item.id}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-950 hover:bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatAppDateLong(item.service_date)}
                    </p>

                    <p
                      className={`text-xs ${
                        active
                          ? "text-white/70"
                          : "text-stone-500"
                      }`}
                    >
                      {item.title} · {item.service_time}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-white/15 text-white"
                        : getStatusClass(item.status)
                    }`}
                  >
                    {active
                      ? "Editando"
                      : getStatusLabel(item.status)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            CREAR PRÓXIMO DOMINGO
        ====================================================== */}

        <form
          id="crear-proximo-domingo"
          action={createNextSundayPlan}
          className="scroll-mt-6 rounded-[34px] border border-sky-200 bg-sky-50 p-5 shadow-sm"
        >
          <input
            type="hidden"
            name="plan_id"
            value={plan.id}
          />

          <input
            type="hidden"
            name="admin_pin"
            value={pin ?? ""}
          />

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Planeación semanal
          </p>

          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Crear próximo domingo
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-700">
            Duplica este plan para el siguiente domingo,
            conservando equipos, horarios y checklist. Los
            responsables e integrantes quedarán pendientes de
            asignar.
          </p>

          <button className="mt-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
            📅 Crear próximo domingo
          </button>

          <p className="mt-3 text-xs text-stone-500">
            Al terminar, abriremos automáticamente el nuevo domingo
            para que puedas comenzar a organizarlo. Si ya existe,
            abriremos directamente la planeación existente.
          </p>
        </form>

        {/* =====================================================
            CUENTAS / AUTH
        ====================================================== */}

        <section className="rounded-[34px] border border-violet-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
                Cuentas
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Vincular servidores
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Relaciona a cada hermano con la cuenta que creó
                dentro de Comunidad VID.
              </p>
            </div>

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              {safeAuthUsers.length} cuentas
            </span>
          </div>

          {authUsersError ? (
            <div className="mt-4 rounded-[22px] border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                No pudimos cargar las cuentas.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Revisa que SUPABASE_SERVICE_ROLE_KEY esté
                configurada correctamente.
              </p>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {profiles.map((profile) => {
              /*
               * Estos campos existirán en profiles después
               * de agregar auth_user_id y email.
               */
              const authUserId =
                "auth_user_id" in profile
                  ? String(profile.auth_user_id ?? "")
                  : "";

              const linkedUser = safeAuthUsers.find(
                (user) => user.id === authUserId
              );

              return (
                <form
                  key={`account-${profile.id}`}
                  action={linkProfileAccount}
                  className="rounded-[24px] border border-stone-200 bg-stone-50 p-4"
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={profile.id}
                  />

                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                      👤
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-950">
                        {profile.full_name}
                      </p>

                      {linkedUser ? (
                        <div className="mt-1">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Cuenta vinculada
                          </span>

                          <p className="mt-2 truncate text-xs text-stone-500">
                            {linkedUser.email}
                          </p>
                        </div>
                      ) : (
                        <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Sin cuenta vinculada
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="mt-4 block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Cuenta registrada
                    </span>

                    <select
                      name="auth_user_id"
                      defaultValue={authUserId}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
                    >
                      <option value="">
                        Sin vincular
                      </option>

                      {safeAuthUsers.map((user) => {
                        const metadataName =
                          typeof user.user_metadata?.full_name ===
                          "string"
                            ? user.user_metadata.full_name
                            : null;

                        return (
                          <option
                            key={user.id}
                            value={user.id}
                          >
                            {metadataName
                              ? `${metadataName} · ${
                                  user.email || "Sin correo"
                                }`
                              : user.email ||
                                "Cuenta sin correo"}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="mt-3 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    {linkedUser
                      ? "Actualizar vínculo"
                      : "Vincular cuenta"}
                  </button>
                </form>
              );
            })}

            {profiles.length === 0 ? (
              <div className="rounded-[22px] bg-stone-50 p-4 text-sm text-stone-500">
                Todavía no hay perfiles de servidores.
              </div>
            ) : null}
          </div>
        </section>

        {/* =====================================================
            DATOS DEL SERVICIO
        ====================================================== */}

        <form
          action={updateServicePlan}
          className="space-y-4 rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm"
        >
          <input
            type="hidden"
            name="id"
            defaultValue={plan.id}
          />

          <h2 className="text-xl font-semibold text-stone-950">
            Datos del servicio
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Título"
              name="title"
              defaultValue={plan.title}
            />

            <Field
              label="Fecha"
              name="service_date"
              type="date"
              defaultValue={plan.service_date}
            />

            <Field
              label="Hora"
              name="service_time"
              defaultValue={plan.service_time}
            />

            <Field
              label="Lugar"
              name="location"
              defaultValue={plan.location}
            />

            <Field
              label="Predicador"
              name="preacher"
              defaultValue={plan.preacher ?? ""}
            />

            <Field
              label="Tema"
              name="theme"
              defaultValue={plan.theme ?? ""}
            />
          </div>

          <TextArea
            label="Versículo"
            name="verse"
            defaultValue={plan.verse ?? ""}
          />

          <TextArea
            label="Notas"
            name="notes"
            defaultValue={plan.notes ?? ""}
          />

          <SelectStatus
            defaultValue={plan.status}
          />

          <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
            Guardar servicio
          </button>
        </form>

        {/* =====================================================
            EQUIPOS
        ====================================================== */}

        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Equipos
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Editar equipos
            </h2>
          </div>

          {teams.map((team, index) => {
            const memberCount =
              team.members?.length ?? 0;

            const teamAssignments =
              assignmentsByTeam.get(team.id) ?? [];

            return (
              <details
                key={team.id}
                open={index === 0}
                className="group overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-xl">
                      {team.emoji || "🤝"}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-stone-950">
                        {team.team_name}
                      </h3>

                      <p className="text-sm text-stone-500">
                        {team.leader_name
                          ? `Responsable: ${team.leader_name}`
                          : "Pendiente de asignar"}{" "}
                        · {memberCount} integrantes
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      team.status
                    )}`}
                  >
                    {getStatusLabel(team.status)}
                  </span>
                </summary>

                <form
                  action={updateServiceTeam}
                  className="space-y-4 border-t border-stone-100 bg-stone-50 p-5"
                >
                  <input
                    type="hidden"
                    name="id"
                    defaultValue={team.id}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Nombre del equipo"
                      name="team_name"
                      defaultValue={team.team_name}
                    />

                    <Field
                      label="Emoji"
                      name="emoji"
                      defaultValue={team.emoji ?? ""}
                    />

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Responsable
                      </span>

                      <select
                        name="leader_name"
                        defaultValue={
                          team.leader_name ?? ""
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
                      >
                        <option value="">
                          Pendiente de asignar
                        </option>

                        {profiles.map((profile) => (
                          <option
                            key={profile.id}
                            value={profile.full_name}
                          >
                            {profile.full_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Field
                      label="Hora de llegada"
                      name="arrival_time"
                      defaultValue={
                        team.arrival_time ?? ""
                      }
                    />

                    <Field
                      label="Hora de servicio"
                      name="service_time"
                      defaultValue={
                        team.service_time ?? ""
                      }
                    />
                  </div>

                  {/* INTEGRANTES */}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Integrantes
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {profiles.map((profile) => {
                        const checked =
                          (
                            team.members ?? []
                          ).includes(
                            profile.full_name
                          );

                        return (
                          <label
                            key={profile.id}
                            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                          >
                            <input
                              type="checkbox"
                              name="members"
                              value={
                                profile.full_name
                              }
                              defaultChecked={
                                checked
                              }
                              className="h-4 w-4"
                            />

                            {profile.full_name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHECKLIST */}

                  <TextArea
                    label="Checklist"
                    name="checklist"
                    defaultValue={(
                      team.checklist ?? []
                    ).join("\n")}
                    placeholder="Una tarea por línea"
                  />

                  <SelectStatus
                    defaultValue={team.status}
                  />

                  <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
                    Guardar equipo
                  </button>
                </form>

                {/* RESPUESTAS Y SOLICITUDES
                    Se muestran FUERA del formulario de edición del equipo
                    para evitar formularios anidados. */}

                <div className="border-t border-stone-100 bg-white p-5">
                  <div className="rounded-[24px] border border-stone-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Respuestas del equipo
                        </p>

                        <p className="mt-1 text-xs text-stone-400">
                          Confirmaciones y solicitudes de cambio de este domingo.
                        </p>
                      </div>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                        {teamAssignments.length}
                      </span>
                    </div>

                    {teamAssignments.length === 0 ? (
                      <p className="mt-3 text-sm leading-6 text-stone-500">
                        Todavía no hay respuestas registradas para este equipo.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {teamAssignments.map((assignment) => {
                          const profile = profileById.get(
                            assignment.profile_id
                          );

                          const checklistTotal = team.checklist?.length ?? 0;
                          const progress =
                            checklistByAssignment.get(assignment.id) ?? [];
                          const completedCount = progress.filter(
                            (item) => item.completed
                          ).length;
                          const preparationPercent =
                            checklistTotal > 0
                              ? Math.round(
                                  (completedCount / checklistTotal) * 100
                                )
                              : 0;
                          const readyToServe =
                            assignment.status === "confirmed" &&
                            checklistTotal > 0 &&
                            completedCount === checklistTotal;

                          return (
                            <div
                              key={assignment.id}
                              className={`rounded-[22px] border p-4 ${
                                assignment.status === "change_requested"
                                  ? "border-sky-200 bg-sky-50"
                                  : "border-stone-100 bg-stone-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-stone-950">
                                    {profile?.full_name ||
                                      "Persona no encontrada"}
                                  </p>

                                  {profile?.phone ? (
                                    <p className="mt-1 text-xs text-stone-500">
                                      {profile.phone}
                                    </p>
                                  ) : null}
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getResponseClass(
                                    assignment.status
                                  )}`}
                                >
                                  {getResponseLabel(assignment.status)}
                                </span>
                              </div>

                              {checklistTotal > 0 ? (
                                <div className="mt-3 rounded-2xl border border-stone-100 bg-white p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                                        Preparación
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-stone-700">
                                        {completedCount}/{checklistTotal} tareas
                                      </p>
                                    </div>

                                    {readyToServe ? (
                                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                        ✓ Listo para servir
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600">
                                        {preparationPercent}%
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        readyToServe
                                          ? "bg-emerald-500"
                                          : "bg-sky-500"
                                      }`}
                                      style={{ width: `${preparationPercent}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 rounded-2xl border border-stone-100 bg-white px-3 py-3">
                                  <p className="text-xs text-stone-500">
                                    Este equipo todavía no tiene checklist de preparación.
                                  </p>
                                </div>
                              )}

                              {assignment.note ? (
                                <div className="mt-3 rounded-2xl border border-white/70 bg-white px-3 py-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                                    Motivo
                                  </p>

                                  <p className="mt-1 text-sm leading-5 text-stone-700">
                                    {assignment.note}
                                  </p>
                                </div>
                              ) : null}

                              {assignment.status === "change_requested" ? (
                                <div className="mt-4 space-y-3">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <form action={keepAssignmentPending}>
                                      <input
                                        type="hidden"
                                        name="assignment_id"
                                        value={assignment.id}
                                      />

                                      <button
                                        type="submit"
                                        className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700"
                                      >
                                        Mantener asignación
                                      </button>
                                    </form>

                                    <form action={resolveAssignmentChange}>
                                      <input
                                        type="hidden"
                                        name="assignment_id"
                                        value={assignment.id}
                                      />

                                      <button
                                        type="submit"
                                        className="w-full rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-semibold text-white"
                                      >
                                        Mantener y confirmar
                                      </button>
                                    </form>
                                  </div>

                                  <form
                                    action={reassignAssignment}
                                    className="space-y-2 rounded-2xl border border-sky-100 bg-white p-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="assignment_id"
                                      value={assignment.id}
                                    />

                                    <label className="block">
                                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                                        Reasignar a
                                      </span>

                                      <select
                                        name="new_profile_id"
                                        required
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300"
                                      >
                                        <option value="" disabled>
                                          Selecciona un reemplazo
                                        </option>

                                        {profiles
                                          .filter(
                                            (item) =>
                                              item.id !== assignment.profile_id
                                          )
                                          .map((item) => (
                                            <option
                                              key={item.id}
                                              value={item.id}
                                            >
                                              {item.full_name}
                                            </option>
                                          ))}
                                      </select>
                                    </label>

                                    <button
                                      type="submit"
                                      className="w-full rounded-2xl bg-stone-950 px-3 py-3 text-xs font-semibold text-white"
                                    >
                                      Reasignar servicio
                                    </button>
                                  </form>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   RESUMEN OPERATIVO
========================================================= */

function OperationalList({
  id,
  title,
  description,
  tone,
  assignments,
  profileById,
  teamById,
  checklistByAssignment,
}: {
  id: string;
  title: string;
  description: string;
  tone: "amber" | "red" | "emerald" | "sky" | "violet";
  assignments: Array<{
    id: string;
    profile_id: string;
    team_id: string;
    status: string;
    note: string | null;
  }>;
  profileById: Map<
    string,
    {
      id: string;
      full_name: string;
      phone: string | null;
    }
  >;
  teamById: Map<
    string,
    {
      id: string;
      team_name: string;
      emoji: string | null;
      checklist: string[] | null;
    }
  >;
  checklistByAssignment: Map<
    string,
    Array<{ completed: boolean }>
  >;
}) {
  const toneClasses = {
    amber: {
      container: "border-amber-100 bg-amber-50",
      title: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
    },
    red: {
      container: "border-red-100 bg-red-50",
      title: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    emerald: {
      container: "border-emerald-100 bg-emerald-50",
      title: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
    },
    sky: {
      container: "border-sky-100 bg-sky-50",
      title: "text-sky-700",
      badge: "bg-sky-100 text-sky-700",
    },
    violet: {
      container: "border-violet-100 bg-violet-50",
      title: "text-violet-700",
      badge: "bg-violet-100 text-violet-700",
    },
  }[tone];

  return (
    <div
      id={id}
      className={`scroll-mt-6 rounded-[26px] border p-4 ${toneClasses.container}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-semibold ${toneClasses.title}`}>
            {title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-stone-600">
            {description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${toneClasses.badge}`}
        >
          {assignments.length}
        </span>
      </div>

      {assignments.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-3 text-sm text-stone-500">
          No hay personas en este estado.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {assignments.map((assignment) => {
            const profile = profileById.get(assignment.profile_id);
            const team = teamById.get(assignment.team_id);
            const checklistTotal = team?.checklist?.length ?? 0;
            const progress = checklistByAssignment.get(assignment.id) ?? [];
            const completedCount = progress.filter((item) => item.completed).length;

            return (
              <div
                key={`${id}-${assignment.id}`}
                className="rounded-[20px] border border-white/80 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-950">
                      {profile?.full_name || "Persona no encontrada"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {team?.emoji || "🤝"} {team?.team_name || "Equipo"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                    {completedCount}/{checklistTotal}
                  </span>
                </div>

                {assignment.note ? (
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    {assignment.note}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTES DE FORMULARIO
========================================================= */

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>

      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      />
    </label>
  );
}

function SelectStatus({
  defaultValue,
}: {
  defaultValue: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Estado
      </span>

      <select
        name="status"
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      >
        <option value="pending">
          Por confirmar
        </option>

        <option value="ready">
          Confirmado
        </option>

        <option value="attention">
          Revisar
        </option>
      </select>
    </label>
  );
}