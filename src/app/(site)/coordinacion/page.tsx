import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import CoordinationTeamCard from "@/components/coordination/coordination-team-card";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { getNextCoordinationService } from "@/lib/coordination-center";

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

export default async function CoordinationPage() {
  const access =
    await requireAnyPermission(
      [
        "dashboard.view",
        "services.view_all",
        "services.create",
        "teams.view_all",
        "teams.manage",
      ],
      {
        redirectTo: "/sin-acceso",
      }
    );

  const service =
    await getNextCoordinationService();

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="overflow-hidden rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Comunidad VID
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Centro de Coordinación
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Bienvenido, {access.fullName}.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/coordinacion/servicios/nuevo"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-stone-950"
            >
              <CalendarPlus2 size={18} />
              Nuevo servicio
            </Link>

            {service ? (
              <Link
                href={`/coordinacion/servicios/${service.id}`}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white"
              >
                <Users size={18} />
                Asignaciones
              </Link>
            ) : null}
          </div>
        </header>

        {!service ? (
          <section className="rounded-[32px] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <CalendarDays size={25} />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              No hay servicios próximos
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Crea el siguiente servicio para comenzar a organizar equipos y confirmaciones.
            </p>

            <Link
              href="/coordinacion/servicios/nuevo"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white"
            >
              <CalendarPlus2 size={18} />
              Crear servicio
            </Link>
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

              <div className="mt-4 space-y-2 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(
                    service.serviceDate
                  )}
                </p>

                {service.serviceTime ? (
                  <p className="flex items-center gap-2">
                    <Clock3 size={16} />
                    {service.serviceTime}
                  </p>
                ) : null}

                {service.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin size={16} />
                    {service.location}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-stone-500">
                      Preparación general
                    </p>

                    <p className="mt-1 text-4xl font-bold text-stone-950">
                      {service.readiness}%
                    </p>
                  </div>

                  <p className="text-sm font-medium text-stone-500">
                    {service.confirmed} de{" "}
                    {service.totalAssigned}
                  </p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${service.readiness}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                  <CheckCircle2
                    size={18}
                    className="mx-auto text-emerald-700"
                  />

                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {service.confirmed}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-600">
                    Confirmados
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-3 text-center">
                  <Clock3
                    size={18}
                    className="mx-auto text-amber-700"
                  />

                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {service.pending}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-amber-600">
                    Pendientes
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-3 text-center">
                  <RefreshCw
                    size={18}
                    className="mx-auto text-red-700"
                  />

                  <p className="mt-2 text-2xl font-bold text-red-700">
                    {service.changes}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.12em] text-red-600">
                    Cambios
                  </p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Estado por ministerio
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Equipos
              </h2>

              <div className="mt-4 space-y-4">
                {service.teams.map(
                  (team) => (
                    <CoordinationTeamCard
                      key={team.id}
                      serviceId={
                        service.id
                      }
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