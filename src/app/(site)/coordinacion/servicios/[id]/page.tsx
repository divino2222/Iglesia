import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

import AssignmentManager from "./assignment-manager";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PlanRow = {
  id: string;
  title: string;
  service_date: string;
  service_time: string | null;
  location: string | null;
};

type TeamRow = {
  id: string;
  team_name: string;
  emoji: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  position_title: string | null;
  ministries: string[] | null;
  is_active: boolean;
};

type AssignmentRow = {
  team_id: string;
  profile_id: string;
};

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

export default async function ServiceDetailPage({
  params,
}: PageProps) {
  await requirePermission(
    "assignments.manage",
    {
      redirectTo: "/sin-acceso",
    }
  );

  const { id } = await params;
  const admin = createAdminClient();

  const [
    planResult,
    teamsResult,
    profilesResult,
    assignmentsResult,
  ] = await Promise.all([
    admin
      .from("service_plans")
      .select(`
        id,
        title,
        service_date,
        service_time,
        location
      `)
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("service_teams")
      .select(`
        id,
        team_name,
        emoji
      `)
      .eq("service_plan_id", id)
      .order("team_name"),

    admin
      .from("profiles")
      .select(`
        id,
        full_name,
        position_title,
        ministries,
        is_active
      `)
      .eq("is_active", true)
      .order("full_name"),

    admin
      .from("service_assignments")
      .select(`
        team_id,
        profile_id
      `)
      .eq("service_plan_id", id),
  ]);

  if (
    planResult.error ||
    !planResult.data
  ) {
    notFound();
  }

  if (teamsResult.error) {
    throw new Error(
      teamsResult.error.message
    );
  }

  if (profilesResult.error) {
    throw new Error(
      profilesResult.error.message
    );
  }

  if (assignmentsResult.error) {
    throw new Error(
      assignmentsResult.error.message
    );
  }

  const plan =
    planResult.data as PlanRow;

  const teams =
    (teamsResult.data ?? []) as TeamRow[];

  const profiles =
    (profilesResult.data ??
      []) as ProfileRow[];

  const assignments =
    (assignmentsResult.data ??
      []) as AssignmentRow[];

  const assignedByTeam =
    new Map<string, string[]>();

  for (const assignment of assignments) {
    const current =
      assignedByTeam.get(
        assignment.team_id
      ) ?? [];

    assignedByTeam.set(
      assignment.team_id,
      [
        ...current,
        assignment.profile_id,
      ]
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <Link
          href="/coordinacion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} />
          Coordinación
        </Link>

        <header className="rounded-[32px] bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Planeación de servicio
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {plan.title}
          </h1>

          <div className="mt-5 space-y-2 text-sm text-white/70">
            <p className="flex items-center gap-2">
              <CalendarDays size={16} />
              {formatDate(
                plan.service_date
              )}
            </p>

            {plan.service_time ? (
              <p className="flex items-center gap-2">
                <Clock3 size={16} />
                {plan.service_time}
              </p>
            ) : null}

            {plan.location ? (
              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {plan.location}
              </p>
            ) : null}
          </div>
        </header>

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Equipos ministeriales
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Selecciona quién servirá
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Marca los integrantes que participarán
            en cada ministerio.
          </p>
        </section>

        <AssignmentManager
          servicePlanId={plan.id}
          teams={teams.map((team) => ({
            id: team.id,
            teamName: team.team_name,
            emoji: team.emoji,
            assignedProfileIds:
              assignedByTeam.get(
                team.id
              ) ?? [],
          }))}
          profiles={profiles.map(
            (profile) => ({
              id: profile.id,
              fullName:
                profile.full_name,
              positionTitle:
                profile.position_title,
              ministries:
                profile.ministries ?? [],
            })
          )}
        />
      </div>
    </main>
  );
}