import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  formatAppDateLong,
  getAppTodayString,
} from "@/lib/date-time";

import { createClient } from "@/lib/supabase/server";
import PersonalChecklistItem from "@/components/serving/personal-checklist-item";

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

/* =========================================================
   ESTADOS
========================================================= */

function getStatusLabel(status: AssignmentStatus) {
  if (status === "confirmed") {
    return "Asistencia confirmada";
  }

  if (status === "change_requested") {
    return "Cambio solicitado";
  }

  return "Pendiente de confirmar";
}

function getStatusClasses(status: AssignmentStatus) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "change_requested") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

/* =========================================================
   FECHAS
========================================================= */




/* =========================================================
   PÁGINA
========================================================= */

export default async function MiServicioPage() {
  const supabase = await createClient();

  /* =========================================================
     USUARIO
  ========================================================= */

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  /* =========================================================
     PERFIL
  ========================================================= */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone,
      photo_url,
      ministries,
      auth_user_id,
      email
      `
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo cargar tu perfil: ${profileError.message}`
    );
  }

  /* =========================================================
     SIN PERFIL VINCULADO
  ========================================================= */

  if (!profile) {
    return (
      <div className="space-y-5 px-4 py-6 pb-28">
        <section className="rounded-[34px] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
              <UsersRound size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Mi servicio
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-stone-950">
                Tu cuenta todavía no está vinculada
              </h1>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Coordinación debe relacionar tu cuenta con tu perfil de
                servidor antes de mostrar tus asignaciones.
              </p>
            </div>
          </div>

          <Link
            href="/mi-cuenta"
            className="mt-5 flex w-full items-center justify-center rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Ver mi cuenta
          </Link>
        </section>
      </div>
    );
  }

  /* =========================================================
     ASIGNACIONES
  ========================================================= */

  const today = getAppTodayString();

  const {
    data: assignments,
    error: assignmentsError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      status,
      note,
      service_plan_id,
      team_id,

      service_plans (
        id,
        service_date,
        title,
        service_time,
        location,
        preacher,
        theme,
        verse,
        notes,
        status
      ),

      service_teams (
        id,
        team_name,
        emoji,
        leader_name,
        arrival_time,
        service_time,
        status,
        members,
        checklist
      )
      `
    )
    .eq("profile_id", profile.id);

  if (assignmentsError) {
    throw new Error(
      `No se pudieron cargar tus asignaciones: ${assignmentsError.message}`
    );
  }

  /* =========================================================
     PRÓXIMA ASIGNACIÓN
  ========================================================= */

  const futureAssignments = (
    assignments ?? []
  )
    .filter((assignment) => {
      const plan = Array.isArray(
        assignment.service_plans
      )
        ? assignment.service_plans[0]
        : assignment.service_plans;

      return (
        plan?.service_date &&
        plan.service_date >= today
      );
    })
    .sort((a, b) => {
      const planA = Array.isArray(
        a.service_plans
      )
        ? a.service_plans[0]
        : a.service_plans;

      const planB = Array.isArray(
        b.service_plans
      )
        ? b.service_plans[0]
        : b.service_plans;

      return String(
        planA?.service_date || ""
      ).localeCompare(
        String(
          planB?.service_date || ""
        )
      );
    });

  const nextAssignment =
    futureAssignments[0];

  /* =========================================================
     SIN ASIGNACIÓN
  ========================================================= */

  if (!nextAssignment) {
    return (
      <div className="space-y-5 px-4 py-6 pb-28">
        <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-5 py-7 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Mi servicio
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Hola, {profile.full_name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Aquí aparecerán tus próximos servicios en Comunidad VID.
            </p>
          </div>

          <div className="p-5">
            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700">
                <CheckCircle2 size={25} />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-stone-950">
                No tienes una asignación próxima
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Cuando coordinación te asigne a un próximo servicio,
                aparecerá automáticamente aquí.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/mi-cuenta"
          className="flex items-center justify-center rounded-[24px] border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-950 shadow-sm"
        >
          Ir a mi cuenta
        </Link>
      </div>
    );
  }

  /* =========================================================
     PLAN + EQUIPO
  ========================================================= */

  const plan = Array.isArray(
    nextAssignment.service_plans
  )
    ? nextAssignment.service_plans[0]
    : nextAssignment.service_plans;

  const team = Array.isArray(
    nextAssignment.service_teams
  )
    ? nextAssignment.service_teams[0]
    : nextAssignment.service_teams;

  if (!plan || !team) {
    throw new Error(
      "La asignación existe, pero faltan datos del servicio o del equipo."
    );
  }

  const status =
    nextAssignment.status as AssignmentStatus;

  /* =========================================================
     CHECKLIST PERSONAL DEL SERVIDOR
  ========================================================= */

  const {
    data: checklistProgress,
    error: checklistProgressError,
  } = await supabase
    .from("assignment_checklist")
    .select(
      `
      id,
      item,
      completed,
      completed_at
      `
    )
    .eq(
      "assignment_id",
      nextAssignment.id
    );

  if (checklistProgressError) {
    throw new Error(
      `No se pudo cargar tu checklist: ${checklistProgressError.message}`
    );
  }

  /*
   * Creamos un mapa:
   *
   * "Confirmar canciones" => true
   * "Revisar instrumentos" => false
   */
  const completedChecklist =
    new Map<string, boolean>(
      (checklistProgress ?? []).map(
        (row) => [
          row.item,
          Boolean(row.completed),
        ]
      )
    );

  const checklistItems =
    team.checklist ?? [];

  const completedCount =
    checklistItems.filter(
      (item: string) =>
        completedChecklist.get(item) === true
    ).length;

  const checklistTotal =
    checklistItems.length;

  const checklistComplete =
    checklistTotal > 0 &&
    completedCount === checklistTotal;

  /* =========================================================
     PANTALLA
  ========================================================= */

  return (
    <div className="space-y-5 px-4 py-6 pb-28">
      {/* =====================================================
          CABECERA / ASIGNACIÓN
      ====================================================== */}

      <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-5 py-7 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            <ShieldCheck size={13} />

            Mi próximo servicio
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Hola, {profile.full_name}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Esta es tu próxima asignación en Comunidad VID.
          </p>
        </div>

        <div className="space-y-4 p-5">
          {/* FECHA */}

          <div className="rounded-[28px] border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-900 shadow-sm">
                <CalendarDays size={21} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Fecha
                </p>

                <p className="mt-1 text-lg font-semibold text-stone-950">
                  {formatAppDateLong(plan.service_date)}
                </p>

                <p className="mt-1 text-sm text-stone-600">
                  {plan.title} ·{" "}
                  {plan.service_time}
                </p>
              </div>
            </div>
          </div>

          {/* EQUIPO */}

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl">
                {team.emoji || "🤝"}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Tu equipo
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  {team.team_name}
                </h2>

                <p className="mt-1 text-sm text-stone-600">
                  {team.leader_name
                    ? `Responsable: ${team.leader_name}`
                    : "Responsable pendiente"}
                </p>
              </div>
            </div>
          </div>

          {/* HORARIOS */}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-stone-100 bg-white p-4">
              <Clock3
                size={18}
                className="text-stone-500"
              />

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Llegada
              </p>

              <p className="mt-1 text-lg font-semibold text-stone-950">
                {team.arrival_time ||
                  "Por confirmar"}
              </p>
            </div>

            <div className="rounded-[24px] border border-stone-100 bg-white p-4">
              <CalendarDays
                size={18}
                className="text-stone-500"
              />

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Servicio
              </p>

              <p className="mt-1 text-lg font-semibold text-stone-950">
                {team.service_time ||
                  plan.service_time}
              </p>
            </div>
          </div>

          {/* ESTADO */}

          <div
            className={`rounded-[24px] border p-4 ${getStatusClasses(
              status
            )}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Estado
            </p>

            <p className="mt-1 text-lg font-semibold">
              {getStatusLabel(status)}
            </p>

            {nextAssignment.note ? (
              <p className="mt-2 text-sm leading-6">
                {nextAssignment.note}
              </p>
            ) : null}
          </div>

          {/* =================================================
              ACCIONES
          ================================================= */}

          <div className="space-y-3 pt-1">
            {status === "confirmed" ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={18} />

                Asistencia confirmada
              </div>
            ) : (
              <Link
                href={`/mi-servicio/confirmar?id=${nextAssignment.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={18} />

                Confirmar que asistiré
              </Link>
            )}

            <Link
              href={`/mi-servicio/cambio?id=${nextAssignment.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <MessageCircle size={18} />

              {status ===
              "change_requested"
                ? "Editar solicitud de cambio"
                : "Solicitar cambio"}
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          CHECKLIST PERSONAL
      ====================================================== */}

      {checklistItems.length > 0 ? (
        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Preparación
          </p>

          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-stone-950">
                Mi checklist
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Marca cada tarea cuando la tengas lista.
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                checklistComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {completedCount}/
              {checklistTotal}
            </span>
          </div>

          {/* PROGRESO */}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width:
                  checklistTotal > 0
                    ? `${
                        (completedCount /
                          checklistTotal) *
                        100
                      }%`
                    : "0%",
              }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {checklistItems.map(
              (item: string) => (
                <PersonalChecklistItem
                  key={item}
                  assignmentId={
                    nextAssignment.id
                  }
                  item={item}
                  completed={
                    completedChecklist.get(
                      item
                    ) ?? false
                  }
                />
              )
            )}
          </div>

          {/* TODO COMPLETO */}

          {checklistComplete ? (
            <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Preparación completa
                </p>

                <p className="mt-1 text-sm leading-5">
                  Ya completaste todas las tareas de preparación de tu
                  equipo.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* =====================================================
          EQUIPO
      ====================================================== */}

      {team.members?.length ? (
        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Equipo
          </p>

          <h2 className="mt-1 text-xl font-semibold text-stone-950">
            Servimos juntos
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {team.members.map(
              (member: string) => (
                <span
                  key={member}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    member ===
                    profile.full_name
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {member}
                </span>
              )
            )}
          </div>
        </section>
      ) : null}

      {/* =====================================================
          CUENTA
      ====================================================== */}

      <Link
        href="/mi-cuenta"
        className="flex items-center justify-center rounded-[22px] border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-700 shadow-sm"
      >
        Ir a mi cuenta
      </Link>
    </div>
  );
}