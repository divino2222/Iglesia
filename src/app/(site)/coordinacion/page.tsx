import Link from "next/link";
import CoordinationAutoRefresh from "@/components/coordination/coordination-auto-refresh";
import {
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import CoordinationTeamCard from "@/components/coordination/coordination-team-card";
import { requireAnyPermission } from "@/lib/auth/permissions";
import {
  getCoordinationServiceOptions,
  getNextCoordinationService,
} from "@/lib/coordination-center";
import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   TIPOS
========================================================= */

type PageProps = {
  searchParams?: Promise<{
    plan?: string;
  }>;
};

/* =========================================================
   FORMATO FECHA COMPLETA
========================================================= */

function formatDate(date: string) {
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

/* =========================================================
   FORMATO FECHA CORTA PARA SELECTOR
========================================================= */

function formatShortDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  const value = new Date(year, month - 1, day);

  const dayNumber = value.toLocaleDateString("es-MX", {
    day: "2-digit",
  });

  const monthName = value
    .toLocaleDateString("es-MX", {
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();

  return {
    day: dayNumber,
    month: monthName,
  };
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function CoordinationPage({
  searchParams,
}: PageProps) {
  /* =======================================================
     PERMISOS
  ======================================================= */

  const access = await requireAnyPermission(
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

  /* =======================================================
     SOLICITUDES PARA SERVIR
  ======================================================= */

  const admin = createAdminClient();

  const {
    count: pendingMinistryRequests,
    error: ministryRequestsError,
  } = await admin
    .from("ministry_requests")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "pending");

  if (ministryRequestsError) {
    throw new Error(ministryRequestsError.message);
  }

  const ministryRequestCount =
    pendingMinistryRequests ?? 0;

  /* =======================================================
     PLAN SOLICITADO EN URL
  ======================================================= */

  const params = await searchParams;

  const selectedPlanId = params?.plan;

  /* =======================================================
     SERVICIOS + SERVICIO ACTIVO
  ======================================================= */

  const [serviceOptions, service] = await Promise.all([
    getCoordinationServiceOptions(),
    getNextCoordinationService(selectedPlanId),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <CoordinationAutoRefresh />
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* =================================================
            CABECERA
        ================================================= */}

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

        {/* =================================================
            SOLICITUDES PARA SERVIR
        ================================================= */}

        <Link
          href="/coordinacion/servir/solicitudes"
          className="block rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ClipboardList size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Comunidad VID
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Solicitudes para servir
                  </h2>
                </div>

                {ministryRequestCount > 0 ? (
                  <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 px-2.5 text-sm font-bold text-white">
                    {ministryRequestCount}
                  </div>
                ) : (
                  <div className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                    Al día
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm leading-5 text-stone-500">
                Revisa a las personas que quieren integrarse a
                un ministerio.
              </p>

              {ministryRequestCount > 0 ? (
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  {ministryRequestCount === 1
                    ? "1 solicitud pendiente de revisión"
                    : `${ministryRequestCount} solicitudes pendientes de revisión`}
                </p>
              ) : null}
            </div>
          </div>
        </Link>

        {/* =================================================
            SELECTOR DE SERVICIO
        ================================================= */}

        {serviceOptions.length > 0 ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Calendario
                </p>

                <h2 className="mt-1 text-lg font-semibold text-stone-950">
                  Seleccionar servicio
                </h2>
              </div>

              <CalendarDays
                size={20}
                className="text-stone-400"
              />
            </div>

            <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1">
              <div className="flex min-w-max gap-2">
                {serviceOptions.map((option) => {
                  const shortDate = formatShortDate(
                    option.serviceDate
                  );

                  const active =
                    service?.id === option.id;

                  return (
                    <Link
                      key={option.id}
                      href={`/coordinacion?plan=${option.id}`}
                      className={`flex min-w-[82px] flex-col items-center justify-center rounded-[20px] border px-4 py-3 transition ${
                        active
                          ? "border-stone-950 bg-stone-950 text-white shadow-md"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          active
                            ? "text-white/60"
                            : "text-stone-400"
                        }`}
                      >
                        {shortDate.month}
                      </span>

                      <span className="mt-1 text-2xl font-bold">
                        {shortDate.day}
                      </span>

                      {option.serviceTime ? (
                        <span
                          className={`mt-1 text-[10px] ${
                            active
                              ? "text-white/60"
                              : "text-stone-400"
                          }`}
                        >
                          {option.serviceTime}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-stone-500">
              Selecciona una fecha para revisar sus equipos,
              asignaciones y confirmaciones.
            </p>
          </section>
        ) : null}

        {/* =================================================
            SIN SERVICIOS
        ================================================= */}

        {!service ? (
          <section className="rounded-[32px] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <CalendarDays size={25} />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              No hay servicios próximos
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Crea el siguiente servicio para comenzar a
              organizar equipos y confirmaciones.
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
            {/* =============================================
                SERVICIO ACTIVO
            ============================================= */}

            <section className="rounded-[34px] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Servicio seleccionado
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                    {service.title}
                  </h2>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Activo
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(service.serviceDate)}
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

              {/* PREPARACIÓN */}

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

              {/* MÉTRICAS */}

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

            {/* =============================================
                EQUIPOS
            ============================================= */}

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Estado por ministerio
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Equipos
              </h2>

              <div className="mt-4 space-y-4">
                {service.teams.map((team) => (
                  <CoordinationTeamCard
                    key={team.id}
                    serviceId={service.id}
                    team={team}
                  />
                ))}

                {service.teams.length === 0 ? (
                  <div className="rounded-[26px] border border-dashed border-stone-300 bg-white p-5 text-center">
                    <p className="text-sm font-semibold text-stone-700">
                      Este servicio todavía no tiene equipos.
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      Entra a Asignaciones para comenzar a
                      organizarlo.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}