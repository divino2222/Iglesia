import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { requirePermission } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatAppDateLong } from "@/lib/date-time";
import PersonalChecklistItem from "@/components/serving/personal-checklist-item";

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   ESTADOS
========================================================= */

function getStatusLabel(
  status: AssignmentStatus
) {
  if (status === "confirmed") {
    return "Asistencia confirmada";
  }

  if (status === "change_requested") {
    return "Cambio solicitado";
  }

  return "Pendiente de confirmar";
}

function getStatusClasses(
  status: AssignmentStatus
) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "change_requested") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function MiServicioDetallePage({
  params,
}: PageProps) {
  await requirePermission("own_assignments.view");

  const { id } = await params;

  if (!id) {
    redirect("/mi-servicio");
  }

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
      auth_user_id
      `
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo cargar tu perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    redirect("/mi-cuenta");
  }

  /* =========================================================
     ASIGNACIÓN
  ========================================================= */

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      status,
      note,
      profile_id,
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
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (
    assignmentError ||
    !assignment
  ) {
    redirect("/mi-servicio");
  }

  const plan = Array.isArray(
    assignment.service_plans
  )
    ? assignment.service_plans[0]
    : assignment.service_plans;

  const team = Array.isArray(
    assignment.service_teams
  )
    ? assignment.service_teams[0]
    : assignment.service_teams;

  if (!plan || !team) {
    throw new Error(
      "La asignación existe, pero faltan datos del servicio o del equipo."
    );
  }

  const status =
    assignment.status as AssignmentStatus;

  /* =========================================================
     CHECKLIST PARTICULAR DE ESTA ASIGNACIÓN
  ========================================================= */

  const {
    data: checklistProgress,
    error: checklistError,
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
      assignment.id
    );

  if (checklistError) {
    throw new Error(
      `No se pudo cargar tu checklist: ${checklistError.message}`
    );
  }

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
        completedChecklist.get(item) ===
        true
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

      {/* VOLVER */}

      <Link
        href="/mi-servicio"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
      >
        <ArrowLeft size={17} />
        Mis servicios
      </Link>

      {/* =====================================================
          CABECERA
      ====================================================== */}

      <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">

        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-5 py-7 text-white">

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            <ShieldCheck size={13} />
            Mi servicio
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {team.emoji || "🤝"}{" "}
            {team.team_name}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Tu asignación para{" "}
            {formatAppDateLong(
              plan.service_date
            )}
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
                  {formatAppDateLong(
                    plan.service_date
                  )}
                </p>

                <p className="mt-1 text-sm text-stone-600">
                  {plan.title}
                </p>

              </div>

            </div>

          </div>

          {/* RESPONSABLE */}

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <UsersRound size={21} />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Responsable
                </p>

                <p className="mt-1 text-lg font-semibold text-stone-950">
                  {team.leader_name ||
                    "Pendiente de asignar"}
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

          {/* UBICACIÓN */}

          {plan.location ? (
            <div className="flex items-start gap-3 rounded-[24px] border border-stone-100 bg-stone-50 p-4">

              <MapPin
                size={19}
                className="mt-0.5 shrink-0 text-stone-500"
              />

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Lugar
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-stone-800">
                  {plan.location}
                </p>

              </div>

            </div>
          ) : null}

          {/* ESTADO */}

          <div
            className={`rounded-[24px] border p-4 ${getStatusClasses(
              status
            )}`}
          >

            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Estado de mi asignación
            </p>

            <p className="mt-1 text-lg font-semibold">
              {getStatusLabel(status)}
            </p>

            {assignment.note ? (
              <p className="mt-2 text-sm leading-6">
                {assignment.note}
              </p>
            ) : null}

          </div>

          {/* ACCIONES */}

          <div className="space-y-3">

            {status === "confirmed" ? (

              <div className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={18} />
                Asistencia confirmada
              </div>

            ) : (

              <Link
                href={`/mi-servicio/confirmar?id=${assignment.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={18} />
                Confirmar que asistiré
              </Link>

            )}

            <Link
              href={`/mi-servicio/cambio?id=${assignment.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700"
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
          CHECKLIST DE ESTE DOMINGO
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

              <p className="mt-1 text-sm leading-6 text-stone-500">
                Tareas específicas para este
                servicio.
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

          {/* BARRA */}

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

          {/* TAREAS */}

          <div className="mt-4 space-y-2">

            {checklistItems.map(
              (item: string) => (

                <PersonalChecklistItem
                  key={item}
                  assignmentId={
                    assignment.id
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

                <p className="mt-1 text-sm">
                  Ya tienes listas todas las
                  tareas para este servicio.
                </p>

              </div>

            </div>

          ) : null}

        </section>

      ) : null}

      {/* =====================================================
          INTEGRANTES DEL EQUIPO
      ====================================================== */}

      {team.members?.length ? (

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Equipo
          </p>

          <h2 className="mt-1 text-xl font-semibold text-stone-950">
            Servimos juntos
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Personas asignadas a este servicio.
          </p>

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

    </div>
  );
}