import {
  CalendarDays,
  Clock3,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getServingAdminData } from "@/lib/serving-admin";
import ServiceStatusBadge from "@/components/serving/service-status-badge";

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function hasLeader(leader?: string | null) {
  return Boolean(leader && leader.trim());
}

export default async function ServingDashboard() {
  const { plan, teams } = await getServingAdminData();

  if (!plan) {
    return (
      <div className="rounded-[30px] border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Todavía no hay plan de servidores publicado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            <UsersRound size={13} />
            Centro de servicio
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Plan de servidores
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/75">
            Organización del domingo para servir con orden, excelencia y unidad.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-[28px] border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-800">
                <CalendarDays size={21} />
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Próximo servicio
                </p>

                <h2 className="mt-1 text-xl font-semibold capitalize text-stone-950">
                  {formatDate(plan.service_date)}
                </h2>

                <p className="mt-1 text-sm text-stone-600">
                  {plan.title} · {plan.service_time}
                </p>
              </div>

              <ServiceStatusBadge status={plan.status} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {plan.preacher ? (
              <div className="rounded-[24px] border border-stone-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Predicador
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-950">
                  {plan.preacher}
                </p>
              </div>
            ) : null}

            {plan.theme ? (
              <div className="rounded-[24px] border border-stone-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Tema
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-950">
                  {plan.theme}
                </p>
              </div>
            ) : null}
          </div>

          {plan.verse ? (
            <div className="rounded-[26px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                Versículo
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {plan.verse}
              </p>
            </div>
          ) : null}

          {plan.notes ? (
            <div className="rounded-[26px] border border-stone-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                Enfoque del servicio
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {plan.notes}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Equipos
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-stone-950">
          Servidores asignados
        </h2>

        <div className="mt-5 space-y-4">
          {teams.map((team) => {
            const assigned = hasLeader(team.leader_name);

            return (
              <article
                key={team.id}
                className="overflow-hidden rounded-[28px] border border-stone-100 bg-stone-50"
              >
                <div className="flex items-start justify-between gap-3 border-b border-stone-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-xl">
                      {team.emoji || "🤝"}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-stone-950">
                        {team.team_name}
                      </h3>

                      {assigned ? (
                        <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
                          <UserRound size={14} />
                          Responsable: {team.leader_name}
                        </p>
                      ) : (
                        <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          <UsersRound size={14} />
                          Pendiente de asignar
                        </p>
                      )}
                    </div>
                  </div>

                  <ServiceStatusBadge status={team.status} />
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Llegada
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">
                        {team.arrival_time || "Por confirmar"}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Servicio
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">
                        {team.service_time || "Por confirmar"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Integrantes
                    </p>

                    {team.members && team.members.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {team.members.map((member) => (
                          <span
                            key={member}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 rounded-[18px] bg-white px-3 py-2 text-sm text-stone-500">
                        Aún no hay servidores asignados a este equipo.
                      </p>
                    )}
                  </div>

                  {team.checklist && team.checklist.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Checklist
                      </p>

                      <div className="mt-2 space-y-2">
                        {team.checklist.map((task) => (
                          <div
                            key={task}
                            className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700"
                          >
                            <span className="h-4 w-4 rounded border border-stone-300" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}