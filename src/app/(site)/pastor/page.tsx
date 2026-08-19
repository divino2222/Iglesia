import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Mic2,
  Users,
} from "lucide-react";

import PastoralTeamCard from "@/components/pastoral/pastoral-team-card";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { getPastoralCenterData } from "@/lib/pastoral-center";

function formatDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PastorPage() {
  const access =
    await requireAnyPermission(
      [
        "dashboard.view",
        "services.view_all",
        "reports.view",
        "teams.view_all",
      ],
      {
        redirectTo: "/sin-acceso",
      }
    );

  const service =
    await getPastoralCenterData();

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Comunidad VID
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Centro Pastoral
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Bienvenido, {access.fullName}.
          </p>

          <p className="mt-5 text-sm leading-6 text-white/65">
            Consulta la preparación general del próximo servicio y los equipos que requieren atención.
          </p>
        </header>

        {!service ? (
          <section className="rounded-[32px] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <CalendarDays
              size={28}
              className="mx-auto text-stone-500"
            />

            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              No hay servicios próximos
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Cuando coordinación cree un nuevo servicio aparecerá aquí.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-[34px] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Próximo servicio
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                {service.title}
              </h2>

              <div className="mt-5 space-y-3 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={17} />
                  {formatDate(
                    service.serviceDate
                  )}
                </p>

                {service.serviceTime ? (
                  <p className="flex items-center gap-2">
                    <Clock3 size={17} />
                    {service.serviceTime}
                  </p>
                ) : null}

                {service.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin size={17} />
                    {service.location}
                  </p>
                ) : null}

                {service.preacher ? (
                  <p className="flex items-center gap-2">
                    <Mic2 size={17} />
                    {service.preacher}
                  </p>
                ) : null}
              </div>

              {service.theme ? (
                <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Tema
                  </p>

                  <p className="mt-2 font-semibold text-stone-900">
                    {service.theme}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
              <p className="text-sm text-white/55">
                Preparación general
              </p>

              <div className="mt-2 flex items-end justify-between">
                <p className="text-5xl font-bold">
                  {service.readiness}%
                </p>

                <p className="text-sm text-white/55">
                  {service.confirmed} de{" "}
                  {service.totalAssigned}
                </p>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${service.readiness}%`,
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <CheckCircle2
                    size={18}
                    className="mx-auto text-emerald-300"
                  />

                  <p className="mt-2 text-2xl font-bold">
                    {service.readyTeams}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                    Listos
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <Clock3
                    size={18}
                    className="mx-auto text-amber-300"
                  />

                  <p className="mt-2 text-2xl font-bold">
                    {service.pending}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                    Pendientes
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <AlertTriangle
                    size={18}
                    className="mx-auto text-red-300"
                  />

                  <p className="mt-2 text-2xl font-bold">
                    {service.changes}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                    Cambios
                  </p>
                </div>
              </div>
            </section>

            {service.unassignedTeams > 0 ? (
              <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Users
                    size={21}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="font-semibold text-amber-900">
                      Equipos sin asignaciones
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      {service.unassignedTeams} ministerio
                      {service.unassignedTeams === 1
                        ? ""
                        : "s"}{" "}
                      todavía no tiene integrantes asignados.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Estado ministerial
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Equipos
              </h2>

              <div className="mt-4 space-y-4">
                {service.teams.map(
                  (team) => (
                    <PastoralTeamCard
                      key={team.id}
                      team={team}
                    />
                  )
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}