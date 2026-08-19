import "server-only";

import type { CurrentAccess } from "@/lib/auth/permissions";
import { canAccessMinistry } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type MinistryMemberStatus =
  | "confirmed"
  | "pending"
  | "change_requested";

export type MinistryCenterMember = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  positionTitle: string | null;
  ministries: string[];
  status: MinistryMemberStatus;
  note: string | null;
  assignmentId: string | null;
  teamId: string | null;
};

export type MinistryReplacementCandidate = {
  id: string;
  fullName: string;
  positionTitle: string | null;
};

export type MinistryCenterPlan = {
  id: string;
  title: string;
  serviceDate: string;
  serviceTime: string | null;
};

export type MinistryCenterData = {
  ministryName: string;
  leaderName: string;
  leaderPosition: string;
  plan: MinistryCenterPlan | null;
  members: MinistryCenterMember[];
  replacementCandidates: MinistryReplacementCandidate[];
  stats: {
    members: number;
    confirmed: number;
    pending: number;
    changes: number;
  };
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  position_title: string | null;
  ministries: string[] | null;
  ministry_scope: string[] | null;
  is_active: boolean;
};

type ServicePlanRow = {
  id: string;
  title: string | null;
  service_date: string;
  service_time: string | null;
};

type ServiceTeamRow = {
  id: string;
  service_plan_id: string;
  team_name: string;
  leader_name: string | null;
  members: string[] | null;
};

type AssignmentRow = {
  id: string;
  service_plan_id: string;
  team_id: string;
  profile_id: string;
  status: string;
  note: string | null;
};

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

function normalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX");
}

function normalizeAssignmentStatus(
  value?: string | null
): MinistryMemberStatus {
  if (value === "confirmed") {
    return "confirmed";
  }

  if (value === "change_requested") {
    return "change_requested";
  }

  return "pending";
}

function getPrimaryMinistry(
  access: CurrentAccess
) {
  const firstScope =
    access.ministryScope.find(
      (item) => item.trim().length > 0
    );

  return firstScope?.trim() || null;
}

function profileBelongsToMinistry(
  profile: ProfileRow,
  ministryName: string
) {
  const normalizedMinistry =
    normalizeName(ministryName);

  return normalizeStringArray(
    profile.ministries
  ).some(
    (ministry) =>
      normalizeName(ministry) ===
      normalizedMinistry
  );
}

function teamBelongsToMinistry(
  team: ServiceTeamRow,
  ministryName: string
) {
  return (
    normalizeName(team.team_name) ===
    normalizeName(ministryName)
  );
}

export async function getMinistryCenterData(
  access: CurrentAccess,
  requestedMinistry?: string | null
): Promise<MinistryCenterData> {
  const admin = createAdminClient();

  const scopedMinistry =
    getPrimaryMinistry(access);

  const ministryName =
    requestedMinistry?.trim() ||
    scopedMinistry;

  if (!ministryName) {
    throw new Error(
      "Tu perfil no tiene un ministerio autorizado."
    );
  }

  if (
    !canAccessMinistry(
      access,
      ministryName
    )
  ) {
    throw new Error(
      "No tienes acceso a este ministerio."
    );
  }

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [
    profilesResult,
    planResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        photo_url,
        position_title,
        ministries,
        ministry_scope,
        is_active
      `)
      .eq("is_active", true)
      .order("full_name", {
        ascending: true,
      }),

    admin
      .from("service_plans")
      .select(`
        id,
        title,
        service_date,
        service_time
      `)
      .gte("service_date", today)
      .order("service_date", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `No se pudieron consultar los integrantes: ${profilesResult.error.message}`
    );
  }

  if (planResult.error) {
    throw new Error(
      `No se pudo consultar el próximo servicio: ${planResult.error.message}`
    );
  }

  const allProfiles =
    (profilesResult.data ?? []) as ProfileRow[];

  const ministryProfiles =
    allProfiles.filter(
      (profile) =>
        profileBelongsToMinistry(
          profile,
          ministryName
        )
    );

  const leaderProfile =
    allProfiles.find(
      (profile) =>
        profile.id === access.profileId
    ) ?? null;

  const plan = planResult.data
    ? (planResult.data as ServicePlanRow)
    : null;

  let teams: ServiceTeamRow[] = [];
  let assignments: AssignmentRow[] = [];
  let allServiceAssignments: AssignmentRow[] = [];

  if (plan) {
    const {
      data: teamsData,
      error: teamsError,
    } = await admin
      .from("service_teams")
      .select(`
        id,
        service_plan_id,
        team_name,
        leader_name,
        members
      `)
      .eq(
        "service_plan_id",
        plan.id
      );

    if (teamsError) {
      throw new Error(
        `No se pudieron consultar los equipos del servicio: ${teamsError.message}`
      );
    }

    const allTeams =
      (teamsData ?? []) as ServiceTeamRow[];

    teams = allTeams.filter((team) =>
      teamBelongsToMinistry(
        team,
        ministryName
      )
    );

    const {
      data: allAssignmentsData,
      error: allAssignmentsError,
    } = await admin
      .from("service_assignments")
      .select(`
        id,
        service_plan_id,
        team_id,
        profile_id,
        status,
        note
      `)
      .eq(
        "service_plan_id",
        plan.id
      );

    if (allAssignmentsError) {
      throw new Error(
        `No se pudieron consultar las asignaciones del servicio: ${allAssignmentsError.message}`
      );
    }

    allServiceAssignments =
      (allAssignmentsData ?? []) as AssignmentRow[];

    const teamIds =
      teams.map((team) => team.id);

    assignments =
      allServiceAssignments.filter(
        (assignment) =>
          teamIds.includes(
            assignment.team_id
          )
      );
  }

  const assignmentByProfileId =
    new Map<string, AssignmentRow>();

  for (const assignment of assignments) {
    if (
      !assignmentByProfileId.has(
        assignment.profile_id
      )
    ) {
      assignmentByProfileId.set(
        assignment.profile_id,
        assignment
      );
    }
  }

  const teamByMemberName =
    new Map<string, ServiceTeamRow>();

  for (const team of teams) {
    const names = [
      team.leader_name,
      ...normalizeStringArray(
        team.members
      ),
    ].filter(
      (
        name
      ): name is string =>
        Boolean(name)
    );

    for (const name of names) {
      teamByMemberName.set(
        normalizeName(name),
        team
      );
    }
  }

  const members =
    ministryProfiles.map(
      (
        profile
      ): MinistryCenterMember => {
        const assignment =
          assignmentByProfileId.get(
            profile.id
          );

        const team =
          teamByMemberName.get(
            normalizeName(
              profile.full_name
            )
          );

        return {
          id: profile.id,
          fullName:
            profile.full_name,
          email: profile.email,
          phone: profile.phone,
          photoUrl:
            profile.photo_url,
          positionTitle:
            profile.position_title,
          ministries:
            normalizeStringArray(
              profile.ministries
            ),
          status: assignment
            ? normalizeAssignmentStatus(
                assignment.status
              )
            : "pending",
          note:
            assignment?.note ?? null,
          assignmentId:
            assignment?.id ?? null,
          teamId:
            assignment?.team_id ??
            team?.id ??
            null,
        };
      }
    );

  const assignedMembers =
    members.filter(
      (member) =>
        Boolean(member.assignmentId)
    );

  const confirmed =
    assignedMembers.filter(
      (member) =>
        member.status === "confirmed"
    ).length;

  const pending =
    assignedMembers.filter(
      (member) =>
        member.status === "pending"
    ).length;

  const changes =
    assignedMembers.filter(
      (member) =>
        member.status ===
        "change_requested"
    ).length;

  const assignedProfileIds =
    new Set(
      allServiceAssignments.map(
        (assignment) =>
          assignment.profile_id
      )
    );

  const replacementCandidates =
    ministryProfiles
      .filter(
        (profile) =>
          !assignedProfileIds.has(
            profile.id
          )
      )
      .map(
        (
          profile
        ): MinistryReplacementCandidate => ({
          id: profile.id,
          fullName:
            profile.full_name,
          positionTitle:
            profile.position_title,
        })
      );

  return {
    ministryName,
    leaderName:
      leaderProfile?.full_name ??
      access.fullName,
    leaderPosition:
      leaderProfile
        ?.position_title ??
      access.roleLabel,
    plan: plan
      ? {
          id: plan.id,
          title:
            plan.title ||
            "Próximo servicio",
          serviceDate:
            plan.service_date,
          serviceTime:
            plan.service_time,
        }
      : null,
    members,
    replacementCandidates,
    stats: {
      members:
        assignedMembers.length,
      confirmed,
      pending,
      changes,
    },
  };
}