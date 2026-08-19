import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type {
  AssignmentRow,
  ProfileRow,
  ServiceTeamRow,
} from "@/lib/serving-admin";

type ServiceReadinessProps = {
  teams: ServiceTeamRow[];
  profiles: ProfileRow[];
  assignments: AssignmentRow[];
};

type ExpectedAssignment = {
  teamId: string;
  teamName: string;
  profileId: string;
  profileName: string;
  status: "pending" | "confirmed" | "change_requested";
};

function buildExpectedAssignments(
  teams: ServiceTeamRow[],
  profiles: ProfileRow[],
  assignments: AssignmentRow[]
): ExpectedAssignment[] {
  const profileByName = new Map(
    profiles.map((profile) => [profile.full_name, profile])
  );

  const responseByProfileTeam = new Map(
    assignments.map((assignment) => [
      `${assignment.profile_id}-${assignment.team_id}`,
      assignment,
    ])
  );

  return teams.flatMap((team) => {
    const assignedNames = Array.from(
      new Set(
        [team.leader_name, ...(team.members ?? [])].filter(
          (name): name is string => Boolean(name)
        )
      )
    );

    return assignedNames.flatMap((name) => {
      const profile = profileByName.get(name);

      if (!profile) {
        return [];
      }

      const response = responseByProfileTeam.get(
        `${profile.id}-${team.id}`
      );

      return [
        {
          teamId: team.id,
          teamName: team.team_name,
          profileId: profile.id,
          profileName: profile.full_name,
          status: response?.status ?? "pending",
        },
      ];
    });
  });
}

function calculatePercentage(completed: number, total: number) {
  if (total === 0) return 0;

  return Math.round((completed / total) * 100);
}

function getProgressLabel(percentage: number) {
  if (percentage === 100) return "Todo listo";
  if (percentage >= 75) return "Casi listo";
  if (percentage >= 40) return "En preparación";
  return "Requiere atención";
}

function getProgressClasses(percentage: number) {
  if (percentage === 100) {
    return {
      bar: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      panel: "border-emerald-100 bg-emerald-50",
    };
  }

  if (percentage >= 75) {
    return {
      bar: "bg-sky-600",
      badge: "bg-sky-100 text-sky-700",
      panel: "border-sky-100 bg-sky-50",
    };
  }

  if (percentage >= 40) {
    return {
      bar: "bg-amber-500",
      badge: "bg-amber-100 text-amber-700",
      panel: "border-amber-100 bg-amber-50",
    };
  }

  return {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    panel: "border-red-100 bg-red-50",
  };
}

export default function ServiceReadiness({
  teams,
  profiles,
  assignments,
}: ServiceReadinessProps) {
  const expectedAssignments = buildExpectedAssignments(
    teams,
    profiles,
    assignments
  );

  const teamsWithLeader = teams.filter((team) =>
    Boolean(team.leader_name?.trim())
  ).length;

  const readyTeams = teams.filter(
    (team) => team.status === "ready"
  ).length;

  const confirmedAssignments = expectedAssignments.filter(
    (assignment) => assignment.status === "confirmed"
  ).length;

  const changeRequests = expectedAssignments.filter(
    (assignment) => assignment.status === "change_requested"
  ).length;

  const leaderProgress = calculatePercentage(
    teamsWithLeader,
    teams.length
  );

  const teamProgress = calculatePercentage(readyTeams, teams.length);

  const confirmationProgress = calculatePercentage(
    confirmedAssignments,
    expectedAssignments.length
  );

  const changeProgress =
    expectedAssignments.length === 0
      ? 0
      : changeRequests === 0
        ? 100
        : Math.max(
            0,
            Math.round(
              ((expectedAssignments.length - changeRequests) /
                expectedAssignments.length) *
                100
            )
          );

  const readinessPercentage = Math.round(
    (leaderProgress +
      teamProgress +
      confirmationProgress +
      changeProgress) /
      4
  );

  const progressLabel = getProgressLabel(readinessPercentage);
  const classes = getProgressClasses(readinessPercentage);

  const teamsWithoutLeader = teams.filter(
    (team) => !team.leader_name?.trim()
  );

  const teamsNotReady = teams.filter(
    (team) => team.status !== "ready"
  );

  const pendingAssignments = expectedAssignments.filter(
    (assignment) => assignment.status === "pending"
  );

  const requestedChanges = expectedAssignments.filter(
    (assignment) => assignment.status === "change_requested"
  );

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Preparación
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Estado del servicio
          </h2>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Progreso calculado con responsables, equipos y confirmaciones.
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${classes.badge}`}
        >
          {progressLabel}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-5xl font-bold tracking-tight text-stone-950">
              {readinessPercentage}%
            </p>

            <p className="mt-1 text-sm text-stone-500">
              de preparación general
            </p>
          </div>

          <p className="text-sm font-semibold text-stone-500">
            {readyTeams}/{teams.length} equipos listos
          </p>
        </div>

        <div className="mt-4 h-4 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${classes.bar}`}
            style={{
              width: `${readinessPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReadinessMetric
          icon={<UserRoundCheck size={18} />}
          label="Responsables"
          value={`${teamsWithLeader}/${teams.length}`}
          complete={teamsWithLeader === teams.length}
        />

        <ReadinessMetric
          icon={<UsersRound size={18} />}
          label="Equipos listos"
          value={`${readyTeams}/${teams.length}`}
          complete={readyTeams === teams.length}
        />

        <ReadinessMetric
          icon={<CheckCircle2 size={18} />}
          label="Confirmaciones"
          value={`${confirmedAssignments}/${expectedAssignments.length}`}
          complete={
            expectedAssignments.length > 0 &&
            confirmedAssignments === expectedAssignments.length
          }
        />

        <ReadinessMetric
          icon={<AlertTriangle size={18} />}
          label="Cambios"
          value={String(changeRequests)}
          complete={changeRequests === 0}
          inverse
        />
      </div>

      <div
        className={`mt-5 rounded-[26px] border p-4 ${classes.panel}`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          Lo que falta
        </p>

        {teamsWithoutLeader.length === 0 &&
        teamsNotReady.length === 0 &&
        pendingAssignments.length === 0 &&
        requestedChanges.length === 0 ? (
          <div className="mt-3 flex items-center gap-3">
            <CheckCircle2
              size={21}
              className="shrink-0 text-emerald-700"
            />

            <p className="text-sm font-semibold text-emerald-800">
              El servicio está completamente preparado.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {teamsWithoutLeader.length > 0 ? (
              <ReadinessPendingItem
                label={`${teamsWithoutLeader.length} equipos sin responsable`}
                detail={teamsWithoutLeader
                  .map((team) => team.team_name)
                  .join(", ")}
              />
            ) : null}

            {teamsNotReady.length > 0 ? (
              <ReadinessPendingItem
                label={`${teamsNotReady.length} equipos aún no están listos`}
                detail={teamsNotReady
                  .map((team) => team.team_name)
                  .join(", ")}
              />
            ) : null}

            {pendingAssignments.length > 0 ? (
              <ReadinessPendingItem
                label={`${pendingAssignments.length} personas sin responder`}
                detail={pendingAssignments
                  .slice(0, 5)
                  .map(
                    (assignment) =>
                      `${assignment.profileName} · ${assignment.teamName}`
                  )
                  .join(", ")}
              />
            ) : null}

            {requestedChanges.length > 0 ? (
              <ReadinessPendingItem
                label={`${requestedChanges.length} solicitudes de cambio`}
                detail={requestedChanges
                  .map(
                    (assignment) =>
                      `${assignment.profileName} · ${assignment.teamName}`
                  )
                  .join(", ")}
                attention
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function ReadinessMetric({
  icon,
  label,
  value,
  complete,
  inverse = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  complete: boolean;
  inverse?: boolean;
}) {
  const successful = inverse ? complete : complete;

  return (
    <div
      className={`rounded-[24px] border p-4 ${
        successful
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-stone-100 bg-stone-50 text-stone-700"
      }`}
    >
      {icon}

      <p className="mt-3 text-2xl font-bold">{value}</p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
        {label}
      </p>
    </div>
  );
}

function ReadinessPendingItem({
  label,
  detail,
  attention = false,
}: {
  label: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/70 px-3 py-3">
      <CircleDashed
        size={17}
        className={`mt-0.5 shrink-0 ${
          attention ? "text-red-600" : "text-stone-500"
        }`}
      />

      <div>
        <p
          className={`text-sm font-semibold ${
            attention ? "text-red-700" : "text-stone-800"
          }`}
        >
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-stone-500">
          {detail}
        </p>
      </div>
    </div>
  );
}