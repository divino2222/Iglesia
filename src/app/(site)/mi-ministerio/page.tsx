import MinistryChangeManager from "@/components/ministry/ministry-change-manager";
import MinistryHeader from "@/components/ministry/ministry-header";
import type { MinistryMember } from "@/components/ministry/ministry-member-card";
import MinistryMembers from "@/components/ministry/ministry-members";
import MinistryPending, {
  type MinistryPendingItem,
} from "@/components/ministry/ministry-pending";
import MinistrySummary from "@/components/ministry/ministry-summary";

import { requirePermission } from "@/lib/auth/permissions";
import { getMinistryCenterData } from "@/lib/ministry-center";

function formatServiceDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export default async function MiMinisterioPage() {
  const access = await requirePermission(
    "teams.view_scoped"
  );

  const ministry = await getMinistryCenterData(
    access
  );

  const pendingItems: MinistryPendingItem[] =
    ministry.members
      .filter((member) =>
        Boolean(member.assignmentId)
      )
      .map((member) => ({
        id: member.id,
        name: member.fullName,
        position: member.positionTitle,
        status: member.status,
        note: member.note,
      }));

  const members: MinistryMember[] =
  ministry.members.map((member) => ({
    id: member.id,
    name: member.fullName,
    position:
      member.positionTitle || "Servidor",
    status: member.assignmentId
      ? member.status
      : "not_assigned",
  }));

  const changeRequests =
    ministry.members.filter(
      (member) =>
        member.status ===
          "change_requested" &&
        Boolean(member.assignmentId)
    );

  const nextService = ministry.plan
    ? `${formatServiceDate(
        ministry.plan.serviceDate
      )}${
        ministry.plan.serviceTime
          ? ` · ${ministry.plan.serviceTime}`
          : ""
      }`
    : "Sin servicio próximo";

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <MinistryHeader
          ministry={ministry.ministryName}
          leader={ministry.leaderName}
          position={ministry.leaderPosition}
          nextService={nextService}
          confirmed={ministry.stats.confirmed}
          total={ministry.stats.members}
        />

        <MinistrySummary
          members={ministry.stats.members}
          confirmed={ministry.stats.confirmed}
          pending={ministry.stats.pending}
          changes={ministry.stats.changes}
        />

        <MinistryPending
          items={pendingItems}
        />

        {changeRequests.length > 0 ? (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Requieren decisión
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Solicitudes de cambio
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Selecciona un reemplazo o devuelve
                la asignación a pendiente.
              </p>
            </div>

            {changeRequests.map((request) => (
              <MinistryChangeManager
                key={request.assignmentId}
                assignmentId={
                  request.assignmentId!
                }
                memberName={
                  request.fullName
                }
                memberPosition={
                  request.positionTitle
                }
                note={request.note}
                replacements={
  ministry.replacementCandidates
    .filter(
      (candidate) =>
        candidate.id !== request.id
    )
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.fullName,
      position:
        candidate.positionTitle,
    }))
}
              />
            ))}
          </section>
        ) : null}

        <MinistryMembers
          members={members}
        />
      </div>
    </main>
  );
}