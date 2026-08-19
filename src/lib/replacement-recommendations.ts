import { createAdminClient } from "@/lib/supabase/admin";

export type ReplacementRecommendation = {
  profileId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  ministries: string[];
  sameMinistry: boolean;
  alreadyAssigned: boolean;
  confirmedCount: number;
  changeRequestCount: number;
  participationCount: number;
  confirmationRate: number;
  score: number;
  recommendationLabel:
    | "Recomendado"
    | "Buena opción"
    | "Disponible"
    | "Ya asignado";
};

type GetRecommendationsInput = {
  servicePlanId: string;
  teamId: string;
  teamName: string;
  excludedProfileId: string;
};

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("es-MX");
}

function calculateConfirmationRate(
  confirmedCount: number,
  participationCount: number
) {
  if (participationCount === 0) {
    return 0;
  }

  return Math.round(
    (confirmedCount / participationCount) * 100
  );
}

function getRecommendationLabel(
  score: number,
  alreadyAssigned: boolean
): ReplacementRecommendation["recommendationLabel"] {
  if (alreadyAssigned) {
    return "Ya asignado";
  }

  if (score >= 80) {
    return "Recomendado";
  }

  if (score >= 55) {
    return "Buena opción";
  }

  return "Disponible";
}

export async function getReplacementRecommendations({
  servicePlanId,
  teamId,
  teamName,
  excludedProfileId,
}: GetRecommendationsInput) {
  const admin = createAdminClient();

  const [
    profilesResult,
    teamsResult,
    assignmentsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        ministries,
        is_active
      `)
      .eq("is_active", true)
      .neq("id", excludedProfileId)
      .order("full_name", {
        ascending: true,
      }),

    admin
      .from("service_teams")
      .select(`
        id,
        leader_name,
        members
      `)
      .eq("service_plan_id", servicePlanId),

    admin
      .from("service_assignments")
      .select(`
        profile_id,
        status,
        service_plan_id,
        team_id
      `),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `No se pudieron consultar los perfiles: ${profilesResult.error.message}`
    );
  }

  if (teamsResult.error) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  if (assignmentsResult.error) {
    throw new Error(
      `No se pudo consultar el historial de asignaciones: ${assignmentsResult.error.message}`
    );
  }

  const profiles = profilesResult.data ?? [];
  const teams = teamsResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];

  const assignedNames = new Set<string>();

  for (const team of teams) {
    if (team.id === teamId) {
      continue;
    }

    if (team.leader_name) {
      assignedNames.add(
        normalizeText(team.leader_name)
      );
    }

    for (const member of team.members ?? []) {
      assignedNames.add(normalizeText(member));
    }
  }

  const normalizedTeamName =
    normalizeText(teamName);

  const recommendations =
    profiles.map((profile) => {
      const ministries = Array.isArray(
        profile.ministries
      )
        ? profile.ministries
        : [];

      const sameMinistry =
        ministries.some(
          (ministry) =>
            normalizeText(ministry) ===
            normalizedTeamName
        );

      const alreadyAssigned =
        assignedNames.has(
          normalizeText(profile.full_name)
        );

      const profileAssignments =
        assignments.filter(
          (assignment) =>
            assignment.profile_id ===
            profile.id
        );

      const confirmedCount =
        profileAssignments.filter(
          (assignment) =>
            assignment.status === "confirmed"
        ).length;

      const changeRequestCount =
        profileAssignments.filter(
          (assignment) =>
            assignment.status ===
            "change_requested"
        ).length;

      const participationCount =
        profileAssignments.length;

      const confirmationRate =
        calculateConfirmationRate(
          confirmedCount,
          participationCount
        );

      /*
       * Puntaje:
       * +50 si pertenece al mismo ministerio.
       * +30 según su porcentaje histórico de confirmación.
       * +20 si nunca o casi nunca solicita cambios.
       * -100 si ya está asignado en otro equipo del servicio.
       */
      let score = 0;

      if (sameMinistry) {
        score += 50;
      }

      score += Math.round(
        confirmationRate * 0.3
      );

      if (changeRequestCount === 0) {
        score += 20;
      } else if (changeRequestCount === 1) {
        score += 12;
      } else if (changeRequestCount === 2) {
        score += 5;
      }

      if (alreadyAssigned) {
        score -= 100;
      }

      return {
        profileId: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        ministries,
        sameMinistry,
        alreadyAssigned,
        confirmedCount,
        changeRequestCount,
        participationCount,
        confirmationRate,
        score,
        recommendationLabel:
          getRecommendationLabel(
            score,
            alreadyAssigned
          ),
      };
    });

  recommendations.sort((a, b) => {
    if (
      a.alreadyAssigned !==
      b.alreadyAssigned
    ) {
      return a.alreadyAssigned ? 1 : -1;
    }

    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.fullName.localeCompare(
      b.fullName,
      "es-MX"
    );
  });

  return recommendations;
}