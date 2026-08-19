import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  UserRoundCheck,
} from "lucide-react";

import { updateChangeRequest } from "@/app/admin/actions";

import type {
  AssignmentRow,
  ProfileRow,
  ServiceTeamRow,
} from "@/lib/serving-admin";

/*
 * AssignmentRow viene de serving-admin,
 * pero este centro también utiliza campos
 * relacionados con resolución y reemplazos.
 *
 * Los declaramos aquí como opcionales para
 * mantener compatibilidad con el tipo original.
 */
type ChangeRequestAssignment =
  AssignmentRow & {
    resolution_status?: string | null;
    resolution_note?: string | null;
    resolution_action?: string | null;

    replacement_assignment_id?: string | null;
    replacement_profile_id?: string | null;

    resolved_by?: string | null;
    resolved_at?: string | null;

    confirmed_at?: string | null;
    updated_at?: string | null;
  };

type ChangeRequestCenterProps = {
  assignments: AssignmentRow[];
  profiles: ProfileRow[];
  teams: ServiceTeamRow[];
  pin: string;
};

export default function ChangeRequestCenter({
  assignments,
  profiles,
  teams,
  pin,
}: ChangeRequestCenterProps) {
  const typedAssignments =
    assignments as ChangeRequestAssignment[];

  const profileById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const teamById = new Map(
    teams.map((team) => [
      team.id,
      team,
    ])
  );

  const assignmentById = new Map(
    typedAssignments.map(
      (assignment) => [
        assignment.id,
        assignment,
      ]
    )
  );

  const changeRequests =
    typedAssignments
      .filter(
        (assignment) =>
          assignment.status ===
          "change_requested"
      )
      .sort(
        (
          first,
          second
        ) => {
          const firstResolved =
            first.resolution_status ===
            "resolved"
              ? 1
              : 0;

          const secondResolved =
            second.resolution_status ===
            "resolved"
              ? 1
              : 0;

          if (
            firstResolved !==
            secondResolved
          ) {
            return (
              firstResolved -
              secondResolved
            );
          }

          const firstDate =
            new Date(
              first.updated_at ??
                0
            ).getTime();

          const secondDate =
            new Date(
              second.updated_at ??
                0
            ).getTime();

          return (
            secondDate -
            firstDate
          );
        }
      );

  const openRequests =
    changeRequests.filter(
      (assignment) =>
        assignment.resolution_status !==
        "resolved"
    );

  const resolvedRequests =
    changeRequests.filter(
      (assignment) =>
        assignment.resolution_status ===
        "resolved"
    );

  const replacementPendingCount =
    changeRequests.filter(
      (assignment) => {
        if (
          assignment.resolution_action !==
            "reassigned" ||
          !assignment.replacement_assignment_id
        ) {
          return false;
        }

        const replacementAssignment =
          assignmentById.get(
            assignment.replacement_assignment_id
          );

        return (
          !replacementAssignment ||
          replacementAssignment.status !==
            "confirmed"
        );
      }
    ).length;

  const replacementConfirmedCount =
    changeRequests.filter(
      (assignment) => {
        if (
          assignment.resolution_action !==
            "reassigned" ||
          !assignment.replacement_assignment_id
        ) {
          return false;
        }

        const replacementAssignment =
          assignmentById.get(
            assignment.replacement_assignment_id
          );

        return (
          replacementAssignment?.status ===
          "confirmed"
        );
      }
    ).length;

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Incidencias
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Solicitudes de cambio
          </h2>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Revisa, documenta y
            resuelve los cambios
            solicitados.
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            openRequests.length > 0
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {openRequests.length >
          0 ? (
            <AlertTriangle
              size={20}
            />
          ) : (
            <CheckCircle2
              size={20}
            />
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          value={
            openRequests.length
          }
          label="Por resolver"
          className="border-red-100 bg-red-50 text-red-700"
        />

        <SummaryCard
          value={
            resolvedRequests.length
          }
          label="Resueltas"
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          value={
            replacementPendingCount
          }
          label="Reemplazos pendientes"
          className="border-amber-100 bg-amber-50 text-amber-700"
        />

        <SummaryCard
          value={
            replacementConfirmedCount
          }
          label="Reemplazos confirmados"
          className="border-sky-100 bg-sky-50 text-sky-700"
        />
      </div>

      {changeRequests.length ===
      0 ? (
        <div className="mt-5 rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2
              size={21}
              className="shrink-0 text-emerald-700"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                No hay solicitudes
                de cambio
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Ninguna persona ha
                solicitado modificar
                su asignación.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {changeRequests.map(
            (assignment) => {
              const profile =
                profileById.get(
                  assignment.profile_id
                );

              const team =
                teamById.get(
                  assignment.team_id
                );

              const isResolved =
                assignment.resolution_status ===
                "resolved";

              const hasReplacement =
                assignment.resolution_action ===
                  "reassigned" &&
                Boolean(
                  assignment.replacement_assignment_id
                );

              const replacementAssignment =
                assignment.replacement_assignment_id
                  ? assignmentById.get(
                      assignment.replacement_assignment_id
                    )
                  : undefined;

              const replacementProfile =
                assignment.replacement_profile_id
                  ? profileById.get(
                      assignment.replacement_profile_id
                    )
                  : undefined;

              const replacementConfirmed =
                hasReplacement &&
                replacementAssignment?.status ===
                  "confirmed";

              const replacementPending =
                hasReplacement &&
                !replacementConfirmed;

              return (
                <article
                  key={
                    assignment.id
                  }
                  className={`overflow-hidden rounded-[28px] border ${
                    isResolved
                      ? "border-emerald-100 bg-emerald-50"
                      : "border-red-100 bg-red-50"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            isResolved
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2
                              size={
                                20
                              }
                            />
                          ) : (
                            <AlertTriangle
                              size={
                                20
                              }
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-950">
                            {profile?.full_name ||
                              "Persona no encontrada"}
                          </p>

                          <p className="mt-1 text-xs text-stone-500">
                            {team?.emoji ||
                              "🤝"}{" "}
                            {team?.team_name ||
                              "Equipo no encontrado"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isResolved
                          ? "Resuelta"
                          : "Por resolver"}
                      </span>
                    </div>

                    {replacementPending ? (
                      <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <Clock3
                              size={
                                18
                              }
                            />
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                              Reemplazo
                              pendiente
                            </p>

                            <p className="mt-1 text-sm font-semibold text-amber-950">
                              {replacementProfile?.full_name ||
                                "La persona asignada"}{" "}
                              todavía no
                              confirma.
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              La solicitud
                              original está
                              resuelta, pero
                              el reemplazo
                              debe confirmar
                              su nueva
                              asignación.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {replacementConfirmed ? (
                      <div className="mt-4 rounded-[22px] border border-sky-200 bg-sky-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                            <UserRoundCheck
                              size={
                                18
                              }
                            />
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                              Reemplazo
                              confirmado
                            </p>

                            <p className="mt-1 text-sm font-semibold text-sky-950">
                              {replacementProfile?.full_name ||
                                "La persona asignada"}{" "}
                              confirmó que
                              cubrirá este
                              lugar.
                            </p>

                            {replacementAssignment?.confirmed_at ? (
                              <p className="mt-1 text-xs text-sky-800">
                                Confirmado
                                el{" "}
                                {new Date(
                                  replacementAssignment.confirmed_at
                                ).toLocaleString(
                                  "es-MX",
                                  {
                                    dateStyle:
                                      "medium",
                                    timeStyle:
                                      "short",
                                    timeZone:
                                      "America/Mexico_City",
                                  }
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {assignment.note ? (
                      <div className="mt-4 rounded-2xl bg-white/80 p-3">
                        <div className="flex items-start gap-2">
                          <MessageCircle
                            size={16}
                            className="mt-0.5 shrink-0 text-stone-500"
                          />

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                              Motivo
                            </p>

                            <p className="mt-1 text-sm leading-6 text-stone-700">
                              {
                                assignment.note
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {isResolved &&
                    assignment.resolution_note ? (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          Resolución
                        </p>

                        <p className="mt-1 text-sm leading-6 text-stone-700">
                          {
                            assignment.resolution_note
                          }
                        </p>

                        {assignment.resolved_by ? (
                          <p className="mt-2 text-xs text-stone-500">
                            Resuelto por{" "}
                            {
                              assignment.resolved_by
                            }
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <Link
                      href={`/admin/assignment/${
                        assignment.id
                      }?pin=${encodeURIComponent(
                        pin
                      )}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                      <ExternalLink
                        size={17}
                      />
                      Revisar caso
                      completo
                    </Link>
                  </div>

                  <form
                    action={
                      updateChangeRequest
                    }
                    className="space-y-3 border-t border-white/70 bg-white/60 p-4"
                  >
                    <input
                      type="hidden"
                      name="pin"
                      value={pin}
                    />

                    <input
                      type="hidden"
                      name="assignment_id"
                      value={
                        assignment.id
                      }
                    />

                    <textarea
                      name="resolution_note"
                      defaultValue={
                        assignment.resolution_note ??
                        ""
                      }
                      placeholder={
                        isResolved
                          ? "Actualiza la nota de resolución…"
                          : "Describe cómo se resolverá la solicitud…"
                      }
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
                    />

                    {isResolved ? (
                      <button
                        type="submit"
                        name="action"
                        value="reopen"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-200"
                      >
                        <RotateCcw
                          size={
                            17
                          }
                        />
                        Reabrir
                        solicitud
                      </button>
                    ) : (
                      <button
                        type="submit"
                        name="action"
                        value="resolved"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <CheckCircle2
                          size={
                            17
                          }
                        />
                        Marcar como
                        resuelta
                      </button>
                    )}
                  </form>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${className}`}
    >
      <p className="text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.14em]">
        {label}
      </p>
    </div>
  );
}