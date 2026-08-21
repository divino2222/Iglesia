import { createClient } from "@/lib/supabase/server";
import { getAppTodayString } from "@/lib/date-time";

/* =========================================================
   ESTADOS
========================================================= */

export type ServiceStatus =
  | "ready"
  | "pending"
  | "attention";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

/* =========================================================
   PLAN DEL SERVICIO
========================================================= */

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
  created_at?: string | null;
};

/* =========================================================
   EQUIPOS
========================================================= */

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
  created_at?: string | null;
};

/* =========================================================
   PERFILES / SERVIDORES
========================================================= */

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  ministries: string[] | null;
  is_active: boolean;

  auth_user_id: string | null;
  email: string | null;

  created_at?: string | null;
};

/* =========================================================
   ASIGNACIONES
========================================================= */

export type AssignmentRow = {
  id: string;
  service_plan_id: string;
  team_id: string;
  profile_id: string;
  status: AssignmentStatus;
  note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* =========================================================
   CHECKLIST INDIVIDUAL
========================================================= */

export type AssignmentChecklistRow = {
  id: string;
  assignment_id: string;
  item: string;
  completed: boolean;
  completed_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* =========================================================
   ACTIVIDAD
========================================================= */

export type ActivityLogRow = {
  id: string;

  action: string;
  entity_type: string;
  description: string;

  actor_name: string | null;
  profile_id: string | null;
  entity_id: string | null;
  service_plan_id: string | null;
  team_id: string | null;

  metadata: Record<string, unknown> | null;

  created_at: string;
};

/* =========================================================
   RESPUESTA COMPLETA DEL ADMIN
========================================================= */

export type ServingAdminData = {
  plan: ServicePlanRow | null;

  plans: ServicePlanRow[];

  teams: ServiceTeamRow[];

  profiles: ProfileRow[];

  assignments: AssignmentRow[];

  assignmentChecklist:
    AssignmentChecklistRow[];

  activities: ActivityLogRow[];
};

/* =========================================================
   OBTENER DATOS DEL PANEL
========================================================= */

export async function getServingAdminData(
  selectedPlanId?: string
): Promise<ServingAdminData> {
  const supabase = await createClient();

  /* =======================================================
     1. TODOS LOS PLANES
  ======================================================= */

  const {
    data: plansData,
    error: plansError,
  } = await supabase
    .from("service_plans")
    .select("*")
    .order("service_date", {
      ascending: false,
    });

  if (plansError) {
    throw new Error(
      `No se pudieron cargar los servicios: ${plansError.message}`
    );
  }

  const plans =
    (plansData ?? []) as ServicePlanRow[];

  /* =======================================================
     2. DETERMINAR QUÉ PLAN EDITAR
  ======================================================= */

  let plan: ServicePlanRow | null =
    null;

  if (selectedPlanId) {
    plan =
      plans.find(
        (item) =>
          item.id ===
          selectedPlanId
      ) ?? null;
  }

  /*
   * Si no se eligió manualmente:
   *
   * buscamos el próximo servicio.
   *
   * Si no hay uno futuro,
   * usamos el más reciente.
   */

  if (!plan && plans.length > 0) {
    const today =
      getAppTodayString();

    const upcomingPlans = [
      ...plans,
    ]
      .filter(
        (item) =>
          item.service_date >=
          today
      )
      .sort((a, b) =>
        a.service_date.localeCompare(
          b.service_date
        )
      );

    if (
      upcomingPlans.length > 0
    ) {
      plan =
        upcomingPlans[0];
    } else {
      plan = plans[0];
    }
  }

  /* =======================================================
     3. PERFILES ACTIVOS
  ======================================================= */

  const {
    data: profilesData,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone,
      photo_url,
      ministries,
      is_active,
      auth_user_id,
      email,
      created_at
      `
    )
    .eq("is_active", true)
    .order("full_name", {
      ascending: true,
    });

  if (profilesError) {
    throw new Error(
      `No se pudieron cargar los perfiles: ${profilesError.message}`
    );
  }

  const profiles =
    (profilesData ?? []) as ProfileRow[];

  /* =======================================================
     SI NO HAY PLAN
  ======================================================= */

  if (!plan) {
    return {
      plan: null,

      plans,

      teams: [],

      profiles,

      assignments: [],

      assignmentChecklist: [],

      activities: [],
    };
  }

  /* =======================================================
     4. EQUIPOS DEL PLAN
  ======================================================= */

  const {
    data: teamsData,
    error: teamsError,
  } = await supabase
    .from("service_teams")
    .select("*")
    .eq(
      "service_plan_id",
      plan.id
    )
    .order("team_name", {
      ascending: true,
    });

  if (teamsError) {
    throw new Error(
      `No se pudieron cargar los equipos: ${teamsError.message}`
    );
  }

  const teams =
    (teamsData ?? []) as ServiceTeamRow[];

  /* =======================================================
     5. ASIGNACIONES
  ======================================================= */

  const {
    data: assignmentsData,
    error: assignmentsError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      service_plan_id,
      team_id,
      profile_id,
      status,
      note,
      created_at,
      updated_at
      `
    )
    .eq(
      "service_plan_id",
      plan.id
    );

  if (assignmentsError) {
    throw new Error(
      `No se pudieron cargar las asignaciones: ${assignmentsError.message}`
    );
  }

  const assignments =
    (assignmentsData ??
      []) as AssignmentRow[];

  /* =======================================================
     6. CHECKLIST INDIVIDUAL
  ======================================================= */

  const assignmentIds =
    assignments.map(
      (assignment) =>
        assignment.id
    );

  let assignmentChecklist:
    AssignmentChecklistRow[] = [];

  if (
    assignmentIds.length > 0
  ) {
    const {
      data: checklistData,
      error: checklistError,
    } = await supabase
      .from(
        "assignment_checklist"
      )
      .select(
        `
        id,
        assignment_id,
        item,
        completed,
        completed_at,
        created_at,
        updated_at
        `
      )
      .in(
        "assignment_id",
        assignmentIds
      );

    if (checklistError) {
      throw new Error(
        `No se pudo cargar el progreso de preparación: ${checklistError.message}`
      );
    }

    assignmentChecklist =
      (checklistData ??
        []) as AssignmentChecklistRow[];
  }

  /* =======================================================
     7. ACTIVIDAD DEL SERVICIO
  ======================================================= */

  const {
    data: activityData,
    error: activityError,
  } = await supabase
    .from("activity_log")
    .select(
      `
      id,
      action,
      entity_type,
      description,
      actor_name,
      profile_id,
      entity_id,
      service_plan_id,
      team_id,
      metadata,
      created_at
      `
    )
    .eq(
      "service_plan_id",
      plan.id
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (activityError) {
    throw new Error(
      `No se pudo cargar la actividad reciente: ${activityError.message}`
    );
  }

  const activities =
    (activityData ??
      []) as ActivityLogRow[];

  /* =======================================================
     8. RESPUESTA COMPLETA
  ======================================================= */

  return {
    plan,

    plans,

    teams,

    profiles,

    assignments,

    assignmentChecklist,

    activities,
  };
}