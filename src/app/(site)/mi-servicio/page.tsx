import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";

import {
  requirePermission,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

import AssignmentResponse from "./assignment-response";

type AssignmentRow = {
  id: string;
  status: string;
  note: string | null;
  service_plans:
    | {
        id: string;
        title: string;
        service_date: string;
        service_time: string | null;
        location: string | null;
      }
    | {
        id: string;
        title: string;
        service_date: string;
        service_time: string | null;
        location: string | null;
      }[]
    | null;
  service_teams:
    | {
        id: string;
        team_name: string;
        emoji: string | null;
        arrival_time: string | null;
        service_time: string | null;
      }
    | {
        id: string;
        team_name: string;
        emoji: string | null;
        arrival_time: string | null;
        service_time: string | null;
      }[]
    | null;
};

function getSingleRelation<T>(
  relation: T | T[] | null
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

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

export default async function MyServicePage() {
  const access =
    await requirePermission(
      "own_assignments.view",
      {
        redirectTo: "/sin-acceso",
      }
    );

  const admin =
    createAdminClient();

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const {
    data,
    error,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      status,
      note,
      service_plans (
        id,
        title,
        service_date,
        service_time,
        location
      ),
      service_teams (
        id,
        team_name,
        emoji,
        arrival_time,
        service_time
      )
    `)
    .eq(
      "profile_id",
      access.profileId
    );

  if (error) {
    throw new Error(
      `No se pudo consultar tu servicio: ${error.message}`
    );
  }

  const assignments =
    ((data ?? []) as AssignmentRow[])
      .map((assignment) => ({
        assignment,
        plan:
          getSingleRelation(
            assignment.service_plans
          ),
        team:
          getSingleRelation(
            assignment.service_teams
          ),
      }))
      .filter(
        (
          item
        ): item is {
          assignment: AssignmentRow;
          plan: NonNullable<
            ReturnType<
              typeof getSingleRelation<{
                id: string;
                title: string;
                service_date: string;
                service_time: string | null;
                location: string | null;
              }>
            >
          >;
          team: NonNullable<
            ReturnType<
              typeof getSingleRelation<{
                id: string;
                team_name: string;
                emoji: string | null;
                arrival_time: string | null;
                service_time: string | null;
              }>
            >
          >;
        } =>
          Boolean(
            item.plan &&
            item.team &&
            item.plan.service_date >=
              today
          )
      )
      .sort((a, b) =>
        a.plan.service_date.localeCompare(
          b.plan.service_date
        )
      );

  const nextAssignment =
    assignments[0] ?? null;

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Comunidad VID
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Mi Servicio
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Hola, {access.fullName}.
          </p>
        </header>

        {!nextAssignment ? (
          <section className="rounded-[32px] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <CalendarDays size={25} />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              No tienes servicios próximos
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Cuando seas asignado a un servicio aparecerá aquí.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-[34px] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Próximo servicio
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                {nextAssignment.plan.title}
              </h2>

              <div className="mt-5 space-y-3 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={17} />

                  {formatDate(
                    nextAssignment.plan
                      .service_date
                  )}
                </p>

                {nextAssignment.plan
                  .service_time ? (
                  <p className="flex items-center gap-2">
                    <Clock3 size={17} />

                    {
                      nextAssignment.plan
                        .service_time
                    }
                  </p>
                ) : null}

                {nextAssignment.plan
                  .location ? (
                  <p className="flex items-center gap-2">
                    <MapPin size={17} />

                    {
                      nextAssignment.plan
                        .location
                    }
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
              <p className="text-3xl">
                {nextAssignment.team
                  .emoji || "🤝"}
              </p>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Ministerio
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                {
                  nextAssignment.team
                    .team_name
                }
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/50">
                    Llegada
                  </p>

                  <p className="mt-1 font-semibold">
                    {nextAssignment.team
                      .arrival_time ||
                      "Por confirmar"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/50">
                    Servicio
                  </p>

                  <p className="mt-1 font-semibold">
                    {nextAssignment.team
                      .service_time ||
                      "Por confirmar"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-white/65">
                <Users size={17} />
                Sirves con el equipo de{" "}
                {
                  nextAssignment.team
                    .team_name
                }
              </div>
            </section>

            <AssignmentResponse
              assignmentId={
                nextAssignment
                  .assignment.id
              }
              currentStatus={
                nextAssignment
                  .assignment.status
              }
            />
          </>
        )}
      </div>
    </main>
  );
}