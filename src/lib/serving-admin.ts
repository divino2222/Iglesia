import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ServiceStatus = "ready" | "pending" | "attention";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: string;
  ministries: string[] | null;
  is_active: boolean;
};

export type MinistryRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  is_active: boolean;
};

export type ServicePlanRow = {
  id: string;
  service_date: string;
  title: string;
  service_time: string;
  location: string;
  preacher: string | null;
  theme: string | null;
  verse: string | null;
  notes: string | null;
  status: ServiceStatus;
};

export type ServiceTeamRow = {
  id: string;
  service_plan_id: string;
  team_name: string;
  emoji: string | null;
  leader_name: string | null;
  arrival_time: string | null;
  service_time: string | null;
  status: ServiceStatus;
  members: string[] | null;
  checklist: string[] | null;
};

export type AssignmentRow = {
  id: string;
  service_plan_id: string;
  team_id: string;
  profile_id: string;
  role: string;
  status: AssignmentStatus;
  note: string | null;
  confirmed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolution_status: "open" | "resolved";
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
};

export type ActivityLogRow = {
  id: string;
  created_at: string;
  profile_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  service_plan_id: string | null;
  team_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
};

function getMexicoCityTodayIso() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export async function getServingAdminData(selectedPlanId?: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    plansResult,
    profilesResult,
    ministriesResult,
  ] = await Promise.all([
    supabase
      .from("service_plans")
      .select("*")
      .order("service_date", { ascending: true }),

    supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),

    supabase
      .from("ministries")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (plansResult.error) {
    throw new Error(
      `No se pudieron consultar los servicios: ${plansResult.error.message}`
    );
  }

  if (profilesResult.error) {
    throw new Error(
      `No se pudieron consultar las personas: ${profilesResult.error.message}`
    );
  }

  if (ministriesResult.error) {
    throw new Error(
      `No se pudieron consultar los ministerios: ${ministriesResult.error.message}`
    );
  }

  const plans = (plansResult.data ?? []) as ServicePlanRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const ministries = (ministriesResult.data ?? []) as MinistryRow[];

  const todayIso = getMexicoCityTodayIso();

  const selectedPlan =
    plans.find((item) => item.id === selectedPlanId) ??
    plans.find((item) => item.service_date >= todayIso) ??
    plans[plans.length - 1] ??
    null;

  if (!selectedPlan) {
    return {
      plan: null,
      plans,
      teams: [] as ServiceTeamRow[],
      profiles,
      ministries,
      assignments: [] as AssignmentRow[],
      activities: [] as ActivityLogRow[],
    };
  }

  const [
    teamsResult,
    assignmentsResult,
    activitiesResult,
  ] = await Promise.all([
    supabase
      .from("service_teams")
      .select("*")
      .eq("service_plan_id", selectedPlan.id)
      .order("team_name", { ascending: true }),

    admin
      .from("service_assignments")
      .select("*")
      .eq("service_plan_id", selectedPlan.id)
      .order("updated_at", { ascending: false }),

    admin
      .from("activity_log")
      .select("*")
      .eq("service_plan_id", selectedPlan.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (teamsResult.error) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  if (assignmentsResult.error) {
    throw new Error(
      `No se pudieron consultar las respuestas: ${assignmentsResult.error.message}`
    );
  }

  if (activitiesResult.error) {
    throw new Error(
      `No se pudo consultar la actividad: ${activitiesResult.error.message}`
    );
  }

  return {
    plan: selectedPlan,
    plans,
    teams: (teamsResult.data ?? []) as ServiceTeamRow[],
    profiles,
    ministries,
    assignments: (assignmentsResult.data ?? []) as AssignmentRow[],
    activities: (activitiesResult.data ?? []) as ActivityLogRow[],
  };
}