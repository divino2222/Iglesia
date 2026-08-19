import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import AssignmentTimeline, {
  type AssignmentTimelineItem,
} from "@/components/admin/assignment-timeline";
import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReplacementRecommendations } from "@/lib/replacement-recommendations";
import { reviewAssignment } from "./actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams?: Promise<{
    pin?: string;
  }>;
};

type ResolutionAction =
  | "approved_without_replacement"
  | "rejected"
  | "reassigned"
  | null;

function getAssignmentStatusLabel(status: string) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "change_requested") {
    return "Cambio solicitado";
  }

  return "Pendiente";
}

function getAssignmentStatusClasses(status: string) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "change_requested") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getResolutionLabel(status?: string | null) {
  return status === "resolved" ? "Resuelta" : "Abierta";
}

function getResolutionClasses(status?: string | null) {
  return status === "resolved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function getResolutionActionLabel(action?: ResolutionAction) {
  if (action === "approved_without_replacement") {
    return "Aprobada sin reemplazo";
  }

  if (action === "rejected") {
    return "Solicitud rechazada";
  }

  if (action === "reassigned") {
    return "Persona reemplazada";
  }

  return "Sin resolución definitiva";
}

function getResolutionActionClasses(action?: ResolutionAction) {
  if (action === "approved_without_replacement") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (action === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (action === "reassigned") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "Sin registro";
  }

  return new Date(date).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

function toMetadata(
  value: unknown
): Record<string, unknown> | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return null;
}

export default async function AssignmentPage({
  params,
  searchParams,
}: PageProps) {
  await requirePermission(
    "change_requests.manage"
  );

  const { id } = await params;
  const query = await searchParams;

  /*
   * Conservamos el PIN por compatibilidad temporal con
   * los enlaces y Server Actions actuales.
   * La autorización real ya se valida mediante permisos.
   */
  const pin = query?.pin ?? "";

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const admin = createAdminClient();

  const {
    data: assignment,
    error: assignmentError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      service_plan_id,
      team_id,
      profile_id,
      role,
      status,
      note,
      confirmed_at,
      created_at,
      updated_at,
      resolution_status,
      resolution_action,
      resolution_note,
      replacement_profile_id,
      replacement_assignment_id,
      replaced_at,
      resolved_at,
      resolved_by
    `)
    .eq("id", id)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `No se pudo consultar la asignación: ${assignmentError.message}`
    );
  }

  if (!assignment) {
    notFound();
  }

  const [
    profileResult,
    teamResult,
    planResult,
    timelineResult,
    notificationsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        photo_url,
        role,
        ministries,
        is_active
      `)
      .eq("id", assignment.profile_id)
      .maybeSingle(),

    admin
      .from("service_teams")
      .select(`
        id,
        service_plan_id,
        team_name,
        emoji,
        leader_name,
        members,
        arrival_time,
        service_time,
        status
      `)
      .eq("id", assignment.team_id)
      .maybeSingle(),

    admin
      .from("service_plans")
      .select(`
        id,
        service_date,
        title,
        service_time,
        location,
        status
      `)
      .eq("id", assignment.service_plan_id)
      .maybeSingle(),

    admin
      .from("activity_log")
      .select(`
        id,
        action,
        description,
        actor_name,
        created_at,
        metadata
      `)
      .or(
        `entity_id.eq.${assignment.id},metadata->>source_assignment_id.eq.${assignment.id}`
      )
      .order("created_at", {
        ascending: true,
      }),

    admin
      .from("notification_queue")
      .select(`
        id,
        type,
        title,
        body,
        recipient,
        sent,
        sent_at,
        created_at,
        payload
      `)
      .eq("assignment_id", assignment.id)
      .order("created_at", {
        ascending: true,
      }),
  ]);

  if (profileResult.error) {
    throw new Error(
      `No se pudo consultar la persona: ${profileResult.error.message}`
    );
  }

  if (teamResult.error) {
    throw new Error(
      `No se pudo consultar el equipo: ${teamResult.error.message}`
    );
  }

  if (planResult.error) {
    throw new Error(
      `No se pudo consultar el servicio: ${planResult.error.message}`
    );
  }

  if (timelineResult.error) {
    console.error(
      "No se pudo consultar la línea del tiempo:",
      timelineResult.error.message
    );
  }

  if (notificationsResult.error) {
    console.error(
      "No se pudieron consultar las notificaciones de la asignación:",
      notificationsResult.error.message
    );
  }

  const profile = profileResult.data;
  const team = teamResult.data;
  const plan = planResult.data;

  if (!profile || !team || !plan) {
    notFound();
  }

  const activityTimelineItems: AssignmentTimelineItem[] = (
    timelineResult.data ?? []
  ).map((item) => ({
    id: item.id,
    source: "activity",
    action: item.action,
    description: item.description,
    actorName: item.actor_name,
    createdAt: item.created_at,
    sent: null,
    sentAt: null,
    metadata: toMetadata(item.metadata),
  }));

  const notificationTimelineItems: AssignmentTimelineItem[] = (
    notificationsResult.data ?? []
  ).map((notification) => ({
    id: notification.id,
    source: "notification",
    action: notification.type,
    description: `${notification.title}: ${notification.body}`,
    actorName:
      notification.recipient === "admin"
        ? "Sistema"
        : "Notificaciones",
    createdAt: notification.created_at,
    sent: notification.sent,
    sentAt: notification.sent_at,
    metadata: toMetadata(notification.payload),
  }));

  const timelineItems = [
    ...activityTimelineItems,
    ...notificationTimelineItems,
  ].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime()
  );

  const replacementRecommendations =
    await getReplacementRecommendations({
      servicePlanId: assignment.service_plan_id,
      teamId: assignment.team_id,
      teamName: team.team_name,
      excludedProfileId: assignment.profile_id,
    });

  const availableRecommendations =
    replacementRecommendations.filter(
      (recommendation) => !recommendation.alreadyAssigned
    );

  const unavailableRecommendations =
    replacementRecommendations.filter(
      (recommendation) => recommendation.alreadyAssigned
    );

  let replacementProfile:
    | {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
      }
    | null = null;

  if (assignment.replacement_profile_id) {
    const {
      data: replacementProfileData,
      error: replacementProfileError,
    } = await admin
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", assignment.replacement_profile_id)
      .maybeSingle();

    if (replacementProfileError) {
      console.error(
        "No se pudo consultar el reemplazo registrado:",
        replacementProfileError.message
      );
    } else {
      replacementProfile = replacementProfileData;
    }
  }

  const isChangeRequest =
    assignment.status === "change_requested";

  const isResolved =
    assignment.resolution_status === "resolved";

  const resolutionAction =
    assignment.resolution_action as ResolutionAction;

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/admin?pin=${encodeURIComponent(pin)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={17} />
          Volver al Centro de Operaciones
        </Link>

        <section className="overflow-hidden rounded-[38px] bg-stone-950 text-white shadow-sm">
          <div className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Revisión de asignación
            </p>

            <div className="mt-4 flex items-start gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/10 bg-cover bg-center text-xl font-bold"
                style={
                  profile.photo_url
                    ? {
                        backgroundImage: `url(${profile.photo_url})`,
                      }
                    : undefined
                }
              >
                {!profile.photo_url
                  ? profile.full_name.slice(0, 1).toUpperCase()
                  : null}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold">
                  {profile.full_name}
                </h1>

                <p className="mt-1 text-sm text-white/70">
                  {team.emoji || "🤝"} {team.team_name}
                </p>

                <p className="mt-1 text-xs text-white/50">
                  {assignment.role === "responsable"
                    ? "Responsable del equipo"
                    : "Integrante del equipo"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoCard
            icon={<CalendarDays size={18} />}
            label="Servicio"
            value={formatDate(plan.service_date)}
          />

          <InfoCard
            icon={<Clock3 size={18} />}
            label="Llegada"
            value={team.arrival_time || "Por confirmar"}
          />

          <InfoCard
            icon={<CheckCircle2 size={18} />}
            label="Inicio"
            value={
              team.service_time ||
              plan.service_time ||
              "Por confirmar"
            }
          />
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Estado actual
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Respuesta
              </p>

              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAssignmentStatusClasses(
                  assignment.status
                )}`}
              >
                {getAssignmentStatusLabel(assignment.status)}
              </span>

              <p className="mt-3 text-xs text-stone-500">
                Actualizado:{" "}
                {formatDateTime(assignment.updated_at)}
              </p>
            </div>

            <div className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Resolución
              </p>

              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getResolutionClasses(
                  assignment.resolution_status
                )}`}
              >
                {getResolutionLabel(
                  assignment.resolution_status
                )}
              </span>

              <p className="mt-3 text-xs text-stone-500">
                {assignment.resolved_at
                  ? `Resuelta: ${formatDateTime(
                      assignment.resolved_at
                    )}`
                  : "Aún no ha sido resuelta"}
              </p>
            </div>
          </div>

          {isResolved && resolutionAction ? (
            <div
              className={`mt-3 rounded-[24px] border p-4 ${getResolutionActionClasses(
                resolutionAction
              )}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                Decisión registrada
              </p>

              <p className="mt-1 text-sm font-semibold">
                {getResolutionActionLabel(resolutionAction)}
              </p>

              {assignment.replaced_at ? (
                <p className="mt-2 text-xs opacity-80">
                  Fecha del reemplazo:{" "}
                  {formatDateTime(assignment.replaced_at)}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isChangeRequest
                  ? "bg-red-100 text-red-700"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {isChangeRequest ? (
                <AlertTriangle size={20} />
              ) : (
                <MessageCircle size={20} />
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Mensaje del servidor
              </p>

              <h2 className="mt-1 text-xl font-semibold text-stone-950">
                {isChangeRequest
                  ? "Motivo de la solicitud"
                  : "Comentario registrado"}
              </h2>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] bg-stone-50 p-4">
            <p className="text-sm leading-6 text-stone-700">
              {assignment.note ||
                "La persona no dejó ningún mensaje."}
            </p>
          </div>
        </section>

        {replacementProfile ? (
          <section className="rounded-[34px] border border-sky-100 bg-sky-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <UserRoundCheck size={20} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Reemplazo asignado
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  {replacementProfile.full_name}
                </h2>

                <p className="mt-2 text-sm text-stone-600">
                  {replacementProfile.email ||
                    "Sin correo registrado"}
                </p>

                <p className="mt-1 text-sm text-stone-600">
                  {replacementProfile.phone ||
                    "Sin teléfono registrado"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {assignment.resolution_note ? (
          <section className="rounded-[34px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Resolución registrada
            </p>

            <p className="mt-3 text-sm leading-6 text-stone-700">
              {assignment.resolution_note}
            </p>

            {assignment.resolved_by ? (
              <p className="mt-3 text-xs text-stone-500">
                Resuelto por {assignment.resolved_by}
              </p>
            ) : null}
          </section>
        ) : null}

        <AssignmentTimeline items={timelineItems} />

        <form
          action={reviewAssignment}
          className="space-y-5 rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm"
        >
          <input
            type="hidden"
            name="pin"
            value={pin}
          />

          <input
            type="hidden"
            name="assignment_id"
            value={assignment.id}
          />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Decisión de coordinación
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Revisar asignación
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Selecciona una acción y registra una nota para dejar
              historial.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Nota de coordinación
            </span>

            <textarea
              name="coordination_note"
              defaultValue={assignment.resolution_note ?? ""}
              placeholder="Ejemplo: Se asignará un reemplazo para este domingo."
              rows={4}
              className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
            />
          </label>

          {!isChangeRequest ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DecisionButton
                value="confirmed"
                icon={<CheckCircle2 size={18} />}
                label="Confirmar asistencia"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              />

              <DecisionButton
                value="pending"
                icon={<Clock3 size={18} />}
                label="Mantener pendiente"
                className="bg-amber-100 text-amber-800 hover:bg-amber-200"
              />
            </div>
          ) : null}

          {isChangeRequest && !isResolved ? (
            <div className="space-y-5">
              <div className="rounded-[26px] border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      Resolver sin reemplazo
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-600">
                      Puedes aprobar que la persona no asista o rechazar
                      su solicitud.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DecisionButton
                    value="approved_without_replacement"
                    icon={<CheckCircle2 size={18} />}
                    label="Aprobar sin reemplazo"
                    className="bg-amber-500 text-white hover:bg-amber-600"
                  />

                  <DecisionButton
                    value="rejected"
                    icon={<UserRoundX size={18} />}
                    label="Rechazar solicitud"
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <UsersRound
                    size={20}
                    className="mt-0.5 shrink-0 text-sky-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      Asignar un reemplazo
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-600">
                      Selecciona quién cubrirá a {profile.full_name} en{" "}
                      {team.team_name}.
                    </p>
                  </div>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Persona de reemplazo
                  </span>

                  <select
                    name="replacement_profile_id"
                    defaultValue=""
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-sky-400"
                  >
                    <option value="">
                      Selecciona una persona
                    </option>

                    {availableRecommendations.length > 0 ? (
                      <optgroup label="Recomendados">
                        {availableRecommendations.map(
                          (recommendation) => (
                            <option
                              key={recommendation.profileId}
                              value={recommendation.profileId}
                            >
                              {recommendation.recommendationLabel} ·{" "}
                              {recommendation.fullName} ·{" "}
                              {recommendation.confirmationRate}% confirmación
                              {recommendation.sameMinistry
                                ? ` · ${team.team_name}`
                                : ""}
                            </option>
                          )
                        )}
                      </optgroup>
                    ) : null}

                    {unavailableRecommendations.length > 0 ? (
                      <optgroup label="Ya asignados en otro equipo">
                        {unavailableRecommendations.map(
                          (recommendation) => (
                            <option
                              key={recommendation.profileId}
                              value={recommendation.profileId}
                              disabled
                            >
                              {recommendation.fullName} · Ya asignado
                            </option>
                          )
                        )}
                      </optgroup>
                    ) : null}
                  </select>
                </label>

                {availableRecommendations.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-red-700">
                    No hay personas disponibles para cubrir esta
                    asignación.
                  </p>
                ) : null}

                <button
                  type="submit"
                  name="decision"
                  value="reassigned"
                  disabled={availableRecommendations.length === 0}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserRoundCheck size={18} />
                  Asignar reemplazo
                </button>
              </div>
            </div>
          ) : null}

          {isChangeRequest && isResolved ? (
            <DecisionButton
              value="reopened_change"
              icon={<RotateCcw size={18} />}
              label="Reabrir solicitud"
              className="bg-red-100 text-red-700 hover:bg-red-200"
            />
          ) : null}
        </form>

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <UserRound
              size={18}
              className="mt-0.5 text-stone-500"
            />

            <div>
              <p className="text-sm font-semibold text-stone-950">
                Datos de contacto
              </p>

              <p className="mt-2 text-sm text-stone-600">
                {profile.email || "Sin correo registrado"}
              </p>

              <p className="mt-1 text-sm text-stone-600">
                {profile.phone || "Sin teléfono registrado"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-stone-500">{icon}</div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold capitalize text-stone-950">
        {value}
      </p>
    </div>
  );
}

function DecisionButton({
  value,
  icon,
  label,
  className,
}: {
  value: string;
  icon: ReactNode;
  label: string;
  className: string;
}) {
  return (
    <button
      type="submit"
      name="decision"
      value={value}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}