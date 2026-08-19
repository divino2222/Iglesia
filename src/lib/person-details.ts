import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PersonRole = {
  id: string;
  name: string;
  label: string;
  description: string | null;
};

export type PersonProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  authUserId: string | null;
  ministries: string[];
  ministryScope: string[];
  role: PersonRole | null;
  createdAt: string;
  updatedAt: string | null;
};

export type PersonAssignment = {
  id: string;
  servicePlanId: string;
  teamId: string;
  teamName: string;
  teamEmoji: string | null;
  serviceDate: string | null;
  serviceTitle: string | null;
  serviceTime: string | null;
  role: string;
  status: string;
  note: string | null;
  confirmedAt: string | null;
  resolutionStatus: string | null;
  resolutionAction: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type PersonActivity = {
  id: string;
  action: string;
  description: string;
  actorName: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type PersonStats = {
  totalAssignments: number;
  confirmed: number;
  pending: number;
  changeRequests: number;
  resolvedChanges: number;
  replacementAssignments: number;
  confirmationRate: number;
  responseRate: number;
  lastParticipationAt: string | null;
};

export type PersonDetail = {
  profile: PersonProfile;
  assignments: PersonAssignment[];
  activities: PersonActivity[];
  stats: PersonStats;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  auth_user_id: string | null;
  ministries: string[] | null;
  ministry_scope: string[] | null;
  created_at: string;
  updated_at: string | null;
  roles:
    | {
        id: string;
        name: string;
        label: string;
        description: string | null;
      }
    | {
        id: string;
        name: string;
        label: string;
        description: string | null;
      }[]
    | null;
};

type AssignmentRow = {
  id: string;
  service_plan_id: string;
  team_id: string;
  role: string;
  status: string;
  note: string | null;
  confirmed_at: string | null;
  resolution_status: string | null;
  resolution_action: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string | null;
};

type TeamRow = {
  id: string;
  team_name: string;
  emoji: string | null;
};

type PlanRow = {
  id: string;
  service_date: string;
  title: string | null;
  service_time: string | null;
};

type ActivityRow = {
  id: string;
  action: string;
  description: string;
  actor_name: string | null;
  created_at: string;
  metadata: unknown;
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

function normalizeStringArray(
  value: string[] | null | undefined
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function toMetadata(
  value: unknown
): Record<string, unknown> | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return null;
}

function calculateRate(
  numerator: number,
  denominator: number
) {
  if (denominator === 0) {
    return 0;
  }

  return Math.round(
    (numerator / denominator) * 100
  );
}

export async function getPersonDetail(
  profileId: string
): Promise<PersonDetail | null> {
  const admin = createAdminClient();

  const {
    data: profileData,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      is_active,
      auth_user_id,
      ministries,
      ministry_scope,
      created_at,
      updated_at,
      roles (
        id,
        name,
        label,
        description
      )
    `)
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar la persona: ${profileError.message}`
    );
  }

  if (!profileData) {
    return null;
  }

  const profileRow =
    profileData as ProfileRow;

  const role = getSingleRelation(
    profileRow.roles
  );

  const {
    data: assignmentData,
    error: assignmentsError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      service_plan_id,
      team_id,
      role,
      status,
      note,
      confirmed_at,
      resolution_status,
      resolution_action,
      resolution_note,
      created_at,
      updated_at
    `)
    .eq("profile_id", profileId)
    .order("created_at", {
      ascending: false,
    });

  if (assignmentsError) {
    throw new Error(
      `No se pudieron consultar las asignaciones: ${assignmentsError.message}`
    );
  }

  const assignments =
    (assignmentData ?? []) as AssignmentRow[];

  const servicePlanIds = Array.from(
    new Set(
      assignments.map(
        (assignment) =>
          assignment.service_plan_id
      )
    )
  );

  const teamIds = Array.from(
    new Set(
      assignments.map(
        (assignment) =>
          assignment.team_id
      )
    )
  );

  const [
    teamsResult,
    plansResult,
    activitiesResult,
  ] = await Promise.all([
    teamIds.length > 0
      ? admin
          .from("service_teams")
          .select(`
            id,
            team_name,
            emoji
          `)
          .in("id", teamIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    servicePlanIds.length > 0
      ? admin
          .from("service_plans")
          .select(`
            id,
            service_date,
            title,
            service_time
          `)
          .in("id", servicePlanIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    admin
      .from("activity_log")
      .select(`
        id,
        action,
        description,
        actor_name,
        created_at,
        metadata
      `)
      .eq("profile_id", profileId)
      .order("created_at", {
        ascending: false,
      })
      .limit(100),
  ]);

  if (teamsResult.error) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  if (plansResult.error) {
    throw new Error(
      `No se pudieron consultar los servicios: ${plansResult.error.message}`
    );
  }

  if (activitiesResult.error) {
    throw new Error(
      `No se pudo consultar el historial: ${activitiesResult.error.message}`
    );
  }

  const teamById = new Map(
    ((teamsResult.data ?? []) as TeamRow[])
      .map((team) => [team.id, team])
  );

  const planById = new Map(
    ((plansResult.data ?? []) as PlanRow[])
      .map((plan) => [plan.id, plan])
  );

  const mappedAssignments: PersonAssignment[] =
    assignments.map((assignment) => {
      const team = teamById.get(
        assignment.team_id
      );

      const plan = planById.get(
        assignment.service_plan_id
      );

      return {
        id: assignment.id,
        servicePlanId:
          assignment.service_plan_id,
        teamId: assignment.team_id,
        teamName:
          team?.team_name ??
          "Equipo no encontrado",
        teamEmoji:
          team?.emoji ?? null,
        serviceDate:
          plan?.service_date ?? null,
        serviceTitle:
          plan?.title ?? null,
        serviceTime:
          plan?.service_time ?? null,
        role: assignment.role,
        status: assignment.status,
        note: assignment.note,
        confirmedAt:
          assignment.confirmed_at,
        resolutionStatus:
          assignment.resolution_status,
        resolutionAction:
          assignment.resolution_action,
        resolutionNote:
          assignment.resolution_note,
        createdAt:
          assignment.created_at,
        updatedAt:
          assignment.updated_at,
      };
    });

  const activities: PersonActivity[] = (
    (activitiesResult.data ?? []) as ActivityRow[]
  ).map((activity) => ({
    id: activity.id,
    action: activity.action,
    description:
      activity.description,
    actorName:
      activity.actor_name,
    createdAt:
      activity.created_at,
    metadata:
      toMetadata(activity.metadata),
  }));

  const totalAssignments =
    mappedAssignments.length;

  const confirmed =
    mappedAssignments.filter(
      (assignment) =>
        assignment.status ===
        "confirmed"
    ).length;

  const pending =
    mappedAssignments.filter(
      (assignment) =>
        assignment.status ===
        "pending"
    ).length;

  const changeRequests =
    mappedAssignments.filter(
      (assignment) =>
        assignment.status ===
        "change_requested"
    ).length;

  const resolvedChanges =
    mappedAssignments.filter(
      (assignment) =>
        assignment.status ===
          "change_requested" &&
        assignment.resolutionStatus ===
          "resolved"
    ).length;

  const replacementAssignments =
    mappedAssignments.filter(
      (assignment) =>
        assignment.note
          ?.toLocaleLowerCase("es-MX")
          .includes("reemplazo de")
    ).length;

  const responded =
    confirmed + changeRequests;

  const lastParticipation =
    mappedAssignments.find(
      (assignment) =>
        assignment.confirmedAt ||
        assignment.status ===
          "confirmed"
    );

  return {
    profile: {
      id: profileRow.id,
      fullName:
        profileRow.full_name,
      email:
        profileRow.email,
      phone:
        profileRow.phone,
      photoUrl:
        profileRow.photo_url,
      isActive:
        profileRow.is_active,
      authUserId:
        profileRow.auth_user_id,
      ministries:
        normalizeStringArray(
          profileRow.ministries
        ),
      ministryScope:
        normalizeStringArray(
          profileRow.ministry_scope
        ),
      role: role
        ? {
            id: role.id,
            name: role.name,
            label: role.label,
            description:
              role.description,
          }
        : null,
      createdAt:
        profileRow.created_at,
      updatedAt:
        profileRow.updated_at,
    },

    assignments:
      mappedAssignments,

    activities,

    stats: {
      totalAssignments,
      confirmed,
      pending,
      changeRequests,
      resolvedChanges,
      replacementAssignments,
      confirmationRate:
        calculateRate(
          confirmed,
          totalAssignments
        ),
      responseRate:
        calculateRate(
          responded,
          totalAssignments
        ),
      lastParticipationAt:
        lastParticipation
          ?.confirmedAt ??
        lastParticipation
          ?.updatedAt ??
        null,
    },
  };
}