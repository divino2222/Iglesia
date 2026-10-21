import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAppTodayString } from "@/lib/date-time";

/* =========================================================
   TIPOS
========================================================= */

export type CoordinationTeamStatus = {
  id: string;
  teamName: string;
  emoji: string | null;

  assigned: number;
  confirmed: number;
  pending: number;
  changes: number;
};

export type CoordinationServiceOption = {
  id: string;
  title: string;
  serviceDate: string;
  serviceTime: string | null;
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

/* =========================================================
   FILAS DE SUPABASE
========================================================= */

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
  id: string;
  service_plan_id: string;
  team_id: string;
  profile_id: string;
  status: string;
};

/* =========================================================
   NORMALIZAR ESTADOS
========================================================= */

function normalizeStatus(
  status: string | null | undefined
):
  | "confirmed"
  | "change_requested"
  | "pending" {
  if (status === "confirmed") {
    return "confirmed";
  }

  if (
    status ===
    "change_requested"
  ) {
    return "change_requested";
  }

  return "pending";
}

/* =========================================================
   SERVICIOS DISPONIBLES PARA EL SELECTOR
========================================================= */

export async function getCoordinationServiceOptions(): Promise<
  CoordinationServiceOption[]
> {
  const admin =
    createAdminClient();

  const today =
    getAppTodayString();

  const {
    data,
    error,
  } = await admin
    .from("service_plans")
    .select(`
      id,
      title,
      service_date,
      service_time
    `)
    .gte(
      "service_date",
      today
    )
    .order(
      "service_date",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `No se pudieron consultar los próximos servicios: ${error.message}`
    );
  }

  return (
    data ?? []
  ).map(
    (plan) => ({
      id:
        plan.id,

      title:
        plan.title,

      serviceDate:
        plan.service_date,

      serviceTime:
        plan.service_time,
    })
  );
}

/* =========================================================
   OBTENER SERVICIO PARA COORDINACIÓN

   Si selectedPlanId existe:
   mostramos exactamente ese servicio.

   Si no existe:
   usamos automáticamente el próximo servicio.
========================================================= */

export async function getNextCoordinationService(
  selectedPlanId?: string
): Promise<
  CoordinationService | null
> {
  const admin =
    createAdminClient();

  const today =
    getAppTodayString();

  let plan:
    PlanRow | null = null;

  /* =======================================================
     1. PLAN SELECCIONADO MANUALMENTE
  ======================================================= */

  if (selectedPlanId) {
    const {
      data:
        selectedPlanData,

      error:
        selectedPlanError,
    } = await admin
      .from("service_plans")
      .select(`
        id,
        title,
        service_date,
        service_time,
        location
      `)
      .eq(
        "id",
        selectedPlanId
      )
      .maybeSingle();

    if (
      selectedPlanError
    ) {
      throw new Error(
        `No se pudo consultar el servicio seleccionado: ${selectedPlanError.message}`
      );
    }

    if (
      selectedPlanData
    ) {
      plan =
        selectedPlanData as PlanRow;
    }
  }

  /* =======================================================
     2. SI NO HAY PLAN SELECCIONADO,
        BUSCAR EL PRÓXIMO
  ======================================================= */

  if (!plan) {
    const {
      data:
        nextPlanData,

      error:
        nextPlanError,
    } = await admin
      .from("service_plans")
      .select(`
        id,
        title,
        service_date,
        service_time,
        location
      `)
      .gte(
        "service_date",
        today
      )
      .order(
        "service_date",
        {
          ascending: true,
        }
      )
      .limit(1)
      .maybeSingle();

    if (
      nextPlanError
    ) {
      throw new Error(
        `No se pudo consultar el próximo servicio: ${nextPlanError.message}`
      );
    }

    if (
      !nextPlanData
    ) {
      return null;
    }

    plan =
      nextPlanData as PlanRow;
  }

  /* =======================================================
     3. EQUIPOS + ASIGNACIONES

     IMPORTANTE:
     "assignments" es ahora la fuente única
     para confirmaciones, pendientes y cambios.
  ======================================================= */

  const [
    teamsResult,
    assignmentsResult,
  ] =
    await Promise.all([
      admin
        .from(
          "service_teams"
        )
        .select(`
          id,
          team_name,
          emoji
        `)
        .eq(
          "service_plan_id",
          plan.id
        )
        .order(
          "team_name",
          {
            ascending: true,
          }
        ),

      admin
        .from(
          "assignments"
        )
        .select(`
          id,
          service_plan_id,
          team_id,
          profile_id,
          status
        `)
        .eq(
          "service_plan_id",
          plan.id
        ),
    ]);

  if (
    teamsResult.error
  ) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  if (
    assignmentsResult.error
  ) {
    throw new Error(
      `No se pudieron consultar las asignaciones: ${assignmentsResult.error.message}`
    );
  }

  const teams =
    (
      teamsResult.data ??
      []
    ) as TeamRow[];

  const assignments =
    (
      assignmentsResult.data ??
      []
    ) as AssignmentRow[];

  /* =======================================================
     4. MÉTRICAS POR EQUIPO
  ======================================================= */

  const teamStatuses =
    teams.map(
      (
        team
      ): CoordinationTeamStatus => {
        const teamAssignments =
          assignments.filter(
            (
              assignment
            ) =>
              assignment.team_id ===
              team.id
          );

        const confirmed =
          teamAssignments.filter(
            (
              assignment
            ) =>
              normalizeStatus(
                assignment.status
              ) ===
              "confirmed"
          ).length;

        const changes =
          teamAssignments.filter(
            (
              assignment
            ) =>
              normalizeStatus(
                assignment.status
              ) ===
              "change_requested"
          ).length;

        const pending =
          teamAssignments.filter(
            (
              assignment
            ) =>
              normalizeStatus(
                assignment.status
              ) ===
              "pending"
          ).length;

        return {
          id:
            team.id,

          teamName:
            team.team_name,

          emoji:
            team.emoji,

          assigned:
            teamAssignments.length,

          confirmed,

          pending,

          changes,
        };
      }
    );

  /* =======================================================
     5. MÉTRICAS GENERALES
  ======================================================= */

  const totalAssigned =
    assignments.length;

  const confirmed =
    assignments.filter(
      (
        assignment
      ) =>
        normalizeStatus(
          assignment.status
        ) ===
        "confirmed"
    ).length;

  const changes =
    assignments.filter(
      (
        assignment
      ) =>
        normalizeStatus(
          assignment.status
        ) ===
        "change_requested"
    ).length;

  const pending =
    assignments.filter(
      (
        assignment
      ) =>
        normalizeStatus(
          assignment.status
        ) ===
        "pending"
    ).length;

  /*
   * Por ahora la preparación general
   * se basa en personas confirmadas.
   *
   * change_requested NO cuenta como confirmado.
   */

  const readiness =
    totalAssigned === 0
      ? 0
      : Math.round(
          (
            confirmed /
            totalAssigned
          ) * 100
        );

  /* =======================================================
     6. RESPUESTA
  ======================================================= */

  return {
    id:
      plan.id,

    title:
      plan.title,

    serviceDate:
      plan.service_date,

    serviceTime:
      plan.service_time,

    location:
      plan.location,

    totalAssigned,

    confirmed,

    pending,

    changes,

    readiness,

    teams:
      teamStatuses,
  };
}