import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

import type { CoordinationTeamStatus } from "@/lib/coordination-center";

type Props = {
  serviceId: string;
  team: CoordinationTeamStatus;
};

export default function CoordinationTeamCard({
  serviceId,
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
    <Link
      href={`/coordinacion/servicios/${serviceId}`}
      className="block rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
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

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-emerald-50 px-2 py-3">
          <p className="text-lg font-bold text-emerald-700">
            {team.confirmed}
          </p>

          <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-600">
            Confirmados
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 px-2 py-3">
          <p className="text-lg font-bold text-amber-700">
            {team.pending}
          </p>

          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-600">
            Pendientes
          </p>
        </div>

        <div className="rounded-2xl bg-red-50 px-2 py-3">
          <p className="text-lg font-bold text-red-700">
            {team.changes}
          </p>

          <p className="text-[10px] uppercase tracking-[0.12em] text-red-600">
            Cambios
          </p>
        </div>
      </div>
    </Link>
  );
}