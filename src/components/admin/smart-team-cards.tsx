import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CircleDashed,
  UserRound,
  UsersRound,
} from "lucide-react";
import type {
  AssignmentRow,
  ProfileRow,
  ServiceTeamRow,
} from "@/lib/serving-admin";

type SmartTeamCardsProps = {
  teams: ServiceTeamRow[];
  profiles: ProfileRow[];
  assignments: AssignmentRow[];
  planId: string;
  pin: string;
};

type AssignedPerson = {
  profileId: string | null;
  fullName: string;
  isLeader: boolean;
  status: "pending" | "confirmed" | "change_requested";
  note: string | null;
};

function getPersonStatusLabel(
  status: "pending" | "confirmed" | "change_requested"
) {
  if (status === "confirmed") return "Confirmó";
  if (status === "change_requested") return "Pidió cambio";
  return "Pendiente";
}

function getPersonStatusClasses(
  status: "pending" | "confirmed" | "change_requested"
) {
  if (status === "confirmed") {
    return {
      icon: "bg-emerald-100 text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
    };
  }

  if (status === "change_requested") {
    return {
      icon: "bg-red-100 text-red-700",
      badge: "bg-red-100 text-red-700",
    };
  }

  return {
    icon: "bg-amber-100 text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  };
}

function getTeamStatusLabel(status: string) {
  if (status === "ready") return "Listo";
  if (status === "attention") return "Revisar";
  return "Pendiente";
}

function getTeamStatusClasses(status: string) {
  if (status === "ready") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "attention") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getProgressClasses(percentage: number) {
  if (percentage === 100) {
    return {
      bar: "bg-emerald-600",
      text: "text-emerald-700",
    };
  }

  if (percentage >= 70) {
    return {
      bar: "bg-sky-600",
      text: "text-sky-700",
    };
  }

  if (percentage >= 40) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    bar: "bg-red-500",
    text: "text-red-700",
  };
}

export default function SmartTeamCards({
  teams,
  profiles,
  assignments,
  planId,
  pin,
}: SmartTeamCardsProps) {
  const profileByName = new Map(
    profiles.map((profile) => [profile.full_name, profile])
  );

  const assignmentByProfileTeam = new Map(
    assignments.map((assignment) => [
      `${assignment.profile_id}-${assignment.team_id}`,
      assignment,
    ])
  );

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Equipos
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Estado por equipo
          </h2>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Responsables, integrantes y confirmaciones del próximo servicio.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          <UsersRound size={20} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {teams.map((team) => {
          const assignedNames = Array.from(
            new Set(
              [team.leader_name, ...(team.members ?? [])].filter(
                (name): name is string => Boolean(name?.trim())
              )
            )
          );

          const assignedPeople: AssignedPerson[] = assignedNames.map(
            (fullName) => {
              const profile = profileByName.get(fullName);
              const assignment = profile
                ? assignmentByProfileTeam.get(`${profile.id}-${team.id}`)
                : undefined;

              return {
                profileId: profile?.id ?? null,
                fullName,
                isLeader: team.leader_name === fullName,
                status: assignment?.status ?? "pending",
                note: assignment?.note ?? null,
              };
            }
          );

          const confirmedCount = assignedPeople.filter(
            (person) => person.status === "confirmed"
          ).length;

          const pendingCount = assignedPeople.filter(
            (person) => person.status === "pending"
          ).length;

          const changeCount = assignedPeople.filter(
            (person) => person.status === "change_requested"
          ).length;

          const confirmationPercentage =
            assignedPeople.length === 0
              ? 0
              : Math.round(
                  (confirmedCount / assignedPeople.length) * 100
                );

          const progressClasses = getProgressClasses(
            confirmationPercentage
          );

          return (
            <article
              key={team.id}
              className="overflow-hidden rounded-[30px] border border-stone-200 bg-stone-50"
            >
              <div className="border-b border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl">
                      {team.emoji || "🤝"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-stone-950">
                        {team.team_name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        {team.leader_name
                          ? `Responsable: ${team.leader_name}`
                          : "Pendiente de asignar"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getTeamStatusClasses(
                      team.status
                    )}`}
                  >
                    {getTeamStatusLabel(team.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] bg-stone-50 p-3">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Clock3 size={15} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                        Llegada
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {team.arrival_time || "Por confirmar"}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-stone-50 p-3">
                    <div className="flex items-center gap-2 text-stone-500">
                      <CheckCircle2 size={15} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                        Servicio
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {team.service_time || "Por confirmar"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Confirmaciones
                      </p>

                      <p
                        className={`mt-1 text-2xl font-bold ${progressClasses.text}`}
                      >
                        {confirmedCount}/{assignedPeople.length}
                      </p>
                    </div>

                    <p
                      className={`text-sm font-semibold ${progressClasses.text}`}
                    >
                      {confirmationPercentage}%
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressClasses.bar}`}
                      style={{
                        width: `${confirmationPercentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {confirmedCount} confirmados
                    </span>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {pendingCount} pendientes
                    </span>

                    {changeCount > 0 ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {changeCount} cambios
                      </span>
                    ) : null}
                  </div>
                </div>

                {assignedPeople.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-stone-300 bg-white p-4">
                    <p className="text-sm font-semibold text-stone-700">
                      Sin personas asignadas
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Asigna un responsable o integrantes desde la
                      administración del servicio.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Integrantes
                    </p>

                    {assignedPeople.map((person) => {
                      const statusClasses = getPersonStatusClasses(
                        person.status
                      );

                      return (
                        <div
                          key={`${team.id}-${person.fullName}`}
                          className="rounded-[22px] border border-stone-100 bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusClasses.icon}`}
                              >
                                {person.status === "confirmed" ? (
                                  <CheckCircle2 size={17} />
                                ) : person.status ===
                                  "change_requested" ? (
                                  <AlertTriangle size={17} />
                                ) : (
                                  <CircleDashed size={17} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-stone-950">
                                  {person.fullName}
                                </p>

                                <div className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                                  {person.isLeader ? (
                                    <>
                                      <UserRound size={12} />
                                      Responsable
                                    </>
                                  ) : (
                                    "Integrante"
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusClasses.badge}`}
                            >
                              {getPersonStatusLabel(person.status)}
                            </span>
                          </div>

                          {person.note ? (
                            <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
                              “{person.note}”
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link
                  href={`/admin/servir?pin=${encodeURIComponent(
                    pin
                  )}&plan=${encodeURIComponent(planId)}`}
                  className="block rounded-2xl bg-stone-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Administrar equipo
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}