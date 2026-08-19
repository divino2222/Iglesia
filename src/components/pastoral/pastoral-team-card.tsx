import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

import type { PastoralTeamStatus } from "@/lib/pastoral-center";

type Props = {
  team: PastoralTeamStatus;
};

export default function PastoralTeamCard({
  team,
}: Props) {
  const isEmpty =
    team.assigned === 0;

  const isReady =
    team.assigned > 0 &&
    team.confirmed ===
      team.assigned;

  const needsAttention =
    team.changes > 0;

  return (
    <article className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl">
            {team.emoji || "🤝"}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-stone-950">
            {team.teamName}
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            {team.assigned} asignado
            {team.assigned === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            needsAttention
              ? "bg-red-100 text-red-700"
              : isReady
                ? "bg-emerald-100 text-emerald-700"
                : isEmpty
                  ? "bg-stone-100 text-stone-500"
                  : "bg-amber-100 text-amber-700"
          }`}
        >
          {needsAttention ? (
            <AlertTriangle size={20} />
          ) : isReady ? (
            <CheckCircle2 size={20} />
          ) : isEmpty ? (
            <Users size={20} />
          ) : (
            <Clock3 size={20} />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-stone-500">
            Preparación
          </p>

          <p className="mt-1 text-2xl font-bold text-stone-950">
            {team.readiness}%
          </p>
        </div>

        <p className="text-xs font-medium text-stone-500">
          {team.confirmed} de{" "}
          {team.assigned}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${team.readiness}%`,
          }}
        />
      </div>

      {needsAttention ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-medium text-red-700">
          {team.changes} solicitud
          {team.changes === 1
            ? ""
            : "es"}{" "}
          de cambio.
        </p>
      ) : null}
    </article>
  );
}