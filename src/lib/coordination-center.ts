import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CoordinationTeamStatus = {
  id: string;
  teamName: string;
  emoji: string | null;
  assigned: number;
  confirmed: number;
  pending: number;
  changes: number;
};

export type CoordinationService = {
  id: string;
  title: string;
  serviceDate: string;
  serviceTime: string | null;
  location: string | null;
  totalAssigned: number;
  confirmed: number;
  pending: number;
  changes: number;
  readiness: number;
  teams: CoordinationTeamStatus[];
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

type AssignmentRow = {
  team_id: string;
  status: string;
};

function normalizeStatus(status: string) {
  if (status === "confirmed") {
    return "confirmed";
  }

  if (status === "change_requested") {
    return "change_requested";
  }

  return "pending";
}

export async function getNextCoordinationService(): Promise<
  CoordinationService | null
> {
  const admin = createAdminClient();

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const {
    data: planData,
    error: planError,
  } = await admin
    .from("service_plans")
    .select(`
      id,
      title,
      service_date,
      service_time,
      location
    `)
    .gte("service_date", today)
    .order("service_date", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(
      `No se pudo consultar el próximo servicio: ${planError.message}`
    );
  }

  if (!planData) {
    return null;
  }

  const plan = planData as PlanRow;

  const [
    teamsResult,
    assignmentsResult,
  ] = await Promise.all([
    admin
      .from("service_teams")
      .select(`
        id,
        team_name,
        emoji
      `)
      .eq(
        "service_plan_id",
        plan.id
      )
      .order("team_name"),

    admin
      .from("service_assignments")
      .select(`
        team_id,
        status
      `)
      .eq(
        "service_plan_id",
        plan.id
      ),
  ]);

  if (teamsResult.error) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  if (assignmentsResult.error) {
    throw new Error(
      `No se pudieron consultar las asignaciones: ${assignmentsResult.error.message}`
    );
  }

  const teams =
    (teamsResult.data ?? []) as TeamRow[];

  const assignments =
    (assignmentsResult.data ??
      []) as AssignmentRow[];

  const teamStatuses =
    teams.map(
      (
        team
      ): CoordinationTeamStatus => {
        const teamAssignments =
          assignments.filter(
            (assignment) =>
              assignment.team_id ===
              team.id
          );

        const confirmed =
          teamAssignments.filter(
            (assignment) =>
              normalizeStatus(
                assignment.status
              ) === "confirmed"
          ).length;

        const changes =
          teamAssignments.filter(
            (assignment) =>
              normalizeStatus(
                assignment.status
              ) ===
              "change_requested"
          ).length;

        const pending =
          teamAssignments.filter(
            (assignment) =>
              normalizeStatus(
                assignment.status
              ) === "pending"
          ).length;

        return {
          id: team.id,
          teamName: team.team_name,
          emoji: team.emoji,
          assigned:
            teamAssignments.length,
          confirmed,
          pending,
          changes,
        };
      }
    );

  const totalAssigned =
    assignments.length;

  const confirmed =
    assignments.filter(
      (assignment) =>
        normalizeStatus(
          assignment.status
        ) === "confirmed"
    ).length;

  const changes =
    assignments.filter(
      (assignment) =>
        normalizeStatus(
          assignment.status
        ) === "change_requested"
    ).length;

  const pending =
    assignments.filter(
      (assignment) =>
        normalizeStatus(
          assignment.status
        ) === "pending"
    ).length;

  const readiness =
    totalAssigned === 0
      ? 0
      : Math.round(
          (confirmed / totalAssigned) *
            100
        );

  return {
    id: plan.id,
    title: plan.title,
    serviceDate:
      plan.service_date,
    serviceTime:
      plan.service_time,
    location: plan.location,
    totalAssigned,
    confirmed,
    pending,
    changes,
    readiness,
    teams: teamStatuses,
  };
}