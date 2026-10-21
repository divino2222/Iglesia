"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requirePermission,
} from "@/lib/auth/permissions";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  sendUserPush,
} from "@/lib/push/send-user-push";

type AssignmentInput = {
  teamId: string;
  profileIds: string[];
};

type ExistingAssignment = {
  id: string;
  service_plan_id: string;
  team_id: string;
  profile_id: string;
  status:
    | "pending"
    | "confirmed"
    | "change_requested";
  note: string | null;
};

/* =========================================================
   FECHA PARA NOTIFICACIONES
========================================================= */

function formatServiceDate(
  dateValue?: string | null
) {
  if (!dateValue) {
    return "el próximo servicio";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone:
        "America/Mexico_City",
    }
  ).format(
    new Date(
      `${dateValue}T12:00:00`
    )
  );
}

/* =========================================================
   REVALIDAR MÓDULO
========================================================= */

function revalidateService(
  servicePlanId: string
) {
  revalidatePath(
    `/coordinacion/servicios/${servicePlanId}`
  );

  revalidatePath(
    `/coordinacion?plan=${servicePlanId}`
  );

  revalidatePath(
    "/coordinacion"
  );

  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/admin/servir"
  );

  revalidatePath(
    "/mi-ministerio"
  );

  revalidatePath(
    "/mi-servicio"
  );
}

/* =========================================================
   GUARDAR ASIGNACIONES
========================================================= */

export async function saveServiceAssignmentsAction(
  servicePlanId: string,
  assignments: AssignmentInput[]
) {
  await requirePermission(
    "assignments.manage",
    {
      redirectTo: "/sin-acceso",
    }
  );

  const admin =
    createAdminClient();

  try {
    /* =====================================================
       1. EQUIPOS EDITADOS
    ===================================================== */

    const teamIds =
      assignments.map(
        (assignment) =>
          assignment.teamId
      );

    if (
      teamIds.length === 0
    ) {
      return {
        success: true,
        error: null,
      };
    }

    /* =====================================================
       2. ASIGNACIONES ACTUALES
    ===================================================== */

    const {
      data:
        existingAssignmentsData,

      error:
        existingAssignmentsError,
    } = await admin
      .from("assignments")
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
        servicePlanId
      )
      .in(
        "team_id",
        teamIds
      );

    if (
      existingAssignmentsError
    ) {
      return {
        success: false,

        error:
          `No se pudieron consultar las asignaciones actuales: ${existingAssignmentsError.message}`,
      };
    }

    const existingAssignments =
      (existingAssignmentsData ??
        []) as ExistingAssignment[];

    /* =====================================================
       3. SELECCIÓN DESEADA
    ===================================================== */

    const desiredKeys =
      new Set<string>();

    for (
      const assignment
      of assignments
    ) {
      for (
        const profileId
        of assignment.profileIds
      ) {
        desiredKeys.add(
          `${assignment.teamId}::${profileId}`
        );
      }
    }

    const existingKeys =
      new Set(
        existingAssignments.map(
          (assignment) =>
            `${assignment.team_id}::${assignment.profile_id}`
        )
      );

    /* =====================================================
       4. ELIMINAR PERSONAS DESMARCADAS

       Las solicitudes de cambio NO se eliminan desde
       este guardado general. Deben resolverse usando
       el flujo de reemplazo.
    ===================================================== */

    const assignmentsToDelete =
      existingAssignments.filter(
        (assignment) => {
          if (
            assignment.status ===
            "change_requested"
          ) {
            return false;
          }

          const key =
            `${assignment.team_id}::${assignment.profile_id}`;

          return !desiredKeys.has(
            key
          );
        }
      );

    if (
      assignmentsToDelete.length >
      0
    ) {
      const idsToDelete =
        assignmentsToDelete.map(
          (assignment) =>
            assignment.id
        );

      const {
        error: deleteError,
      } = await admin
        .from("assignments")
        .delete()
        .in(
          "id",
          idsToDelete
        );

      if (deleteError) {
        return {
          success: false,

          error:
            `No se pudieron eliminar las asignaciones retiradas: ${deleteError.message}`,
        };
      }
    }

    /* =====================================================
       5. NUEVAS ASIGNACIONES
    ===================================================== */

    const rowsToInsert:
      {
        service_plan_id: string;
        team_id: string;
        profile_id: string;
        status: "pending";
        note: null;
      }[] = [];

    for (
      const assignment
      of assignments
    ) {
      for (
        const profileId
        of assignment.profileIds
      ) {
        const key =
          `${assignment.teamId}::${profileId}`;

        if (
          existingKeys.has(
            key
          )
        ) {
          continue;
        }

        rowsToInsert.push({
          service_plan_id:
            servicePlanId,

          team_id:
            assignment.teamId,

          profile_id:
            profileId,

          status:
            "pending",

          note:
            null,
        });
      }
    }

    if (
      rowsToInsert.length > 0
    ) {
      const {
        error: insertError,
      } = await admin
        .from("assignments")
        .insert(
          rowsToInsert
        );

      if (insertError) {
        return {
          success: false,

          error:
            `No se pudieron crear las nuevas asignaciones: ${insertError.message}`,
        };
      }
    }

    /* =====================================================
       6. MEMBERS DE EQUIPOS

       Para cambios solicitados conservamos a la persona
       hasta que el coordinador resuelva formalmente.
    ===================================================== */

    for (
      const assignment
      of assignments
    ) {
      const protectedChangeIds =
        existingAssignments
          .filter(
            (item) =>
              item.team_id ===
                assignment.teamId &&
              item.status ===
                "change_requested"
          )
          .map(
            (item) =>
              item.profile_id
          );

      const finalProfileIds =
        Array.from(
          new Set([
            ...assignment.profileIds,
            ...protectedChangeIds,
          ])
        );

      let memberNames:
        string[] = [];

      if (
        finalProfileIds.length >
        0
      ) {
        const {
          data:
            selectedProfiles,

          error:
            selectedProfilesError,
        } = await admin
          .from("profiles")
          .select(
            "id,full_name"
          )
          .in(
            "id",
            finalProfileIds
          );

        if (
          selectedProfilesError
        ) {
          return {
            success: false,

            error:
              `No se pudieron consultar los integrantes del equipo: ${selectedProfilesError.message}`,
          };
        }

        const namesById =
          new Map(
            (
              selectedProfiles ??
              []
            ).map(
              (profile) => [
                profile.id,
                profile.full_name,
              ]
            )
          );

        memberNames =
          finalProfileIds
            .map(
              (profileId) =>
                namesById.get(
                  profileId
                )
            )
            .filter(
              (
                name
              ): name is string =>
                Boolean(name)
            );
      }

      const {
        error:
          teamUpdateError,
      } = await admin
        .from("service_teams")
        .update({
          members:
            memberNames,
        })
        .eq(
          "id",
          assignment.teamId
        )
        .eq(
          "service_plan_id",
          servicePlanId
        );

      if (
        teamUpdateError
      ) {
        return {
          success: false,

          error:
            `No se pudo actualizar el equipo: ${teamUpdateError.message}`,
        };
      }
    }

    revalidateService(
      servicePlanId
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "saveServiceAssignmentsAction:",
      error
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "No fue posible guardar las asignaciones.",
    };
  }
}

/* =========================================================
   RESOLVER SOLICITUD DE CAMBIO
========================================================= */

export async function resolveChangeRequestAction(
  assignmentId: string,
  replacementProfileId: string
) {
  await requirePermission(
    "assignments.manage",
    {
      redirectTo: "/sin-acceso",
    }
  );

  const admin =
    createAdminClient();

  const cleanAssignmentId =
    String(
      assignmentId || ""
    ).trim();

  const cleanReplacementId =
    String(
      replacementProfileId ||
        ""
    ).trim();

  if (
    !cleanAssignmentId ||
    !cleanReplacementId
  ) {
    return {
      success: false,
      error:
        "Selecciona una persona para realizar el reemplazo.",
    };
  }

  try {
    /* =====================================================
       1. SOLICITUD ACTUAL
    ===================================================== */

    const {
      data:
        currentAssignment,

      error:
        assignmentError,
    } = await admin
      .from("assignments")
      .select(`
        id,
        service_plan_id,
        team_id,
        profile_id,
        status,
        note
      `)
      .eq(
        "id",
        cleanAssignmentId
      )
      .maybeSingle();

    if (
      assignmentError
    ) {
      return {
        success: false,

        error:
          `No se pudo consultar la solicitud: ${assignmentError.message}`,
      };
    }

    if (
      !currentAssignment
    ) {
      return {
        success: false,

        error:
          "La solicitud de cambio ya no existe.",
      };
    }

    if (
      currentAssignment.status !==
      "change_requested"
    ) {
      return {
        success: false,

        error:
          "Esta asignación ya no tiene una solicitud de cambio pendiente.",
      };
    }

    if (
      currentAssignment.profile_id ===
      cleanReplacementId
    ) {
      return {
        success: false,

        error:
          "El reemplazo debe ser una persona diferente.",
      };
    }

    /* =====================================================
       2. VALIDAR QUE EL REEMPLAZO NO ESTÉ YA ASIGNADO
          EN ESTE MISMO SERVICIO
    ===================================================== */

    const {
      data:
        existingReplacementRows,

      error:
        existingReplacementError,
    } = await admin
      .from("assignments")
      .select(
        "id,team_id"
      )
      .eq(
        "service_plan_id",
        currentAssignment.service_plan_id
      )
      .eq(
        "profile_id",
        cleanReplacementId
      )
      .limit(1);

    if (
      existingReplacementError
    ) {
      return {
        success: false,

        error:
          `No se pudo validar al reemplazo: ${existingReplacementError.message}`,
      };
    }

    if (
      (
        existingReplacementRows ??
        []
      ).length > 0
    ) {
      return {
        success: false,

        error:
          "La persona seleccionada ya está asignada a este servicio.",
      };
    }

    /* =====================================================
       3. DATOS DEL SOLICITANTE, REEMPLAZO, EQUIPO Y PLAN
    ===================================================== */

    const [
      profilesResult,
      teamResult,
      planResult,
    ] =
      await Promise.all([
        admin
          .from("profiles")
          .select(`
            id,
            full_name,
            auth_user_id,
            is_active
          `)
          .in(
            "id",
            [
              currentAssignment.profile_id,
              cleanReplacementId,
            ]
          ),

        admin
          .from("service_teams")
          .select(`
            id,
            team_name,
            leader_name,
            members,
            arrival_time
          `)
          .eq(
            "id",
            currentAssignment.team_id
          )
          .maybeSingle(),

        admin
          .from("service_plans")
          .select(`
            id,
            service_date,
            title,
            service_time
          `)
          .eq(
            "id",
            currentAssignment.service_plan_id
          )
          .maybeSingle(),
      ]);

    if (
      profilesResult.error
    ) {
      return {
        success: false,

        error:
          `No se pudieron consultar los perfiles: ${profilesResult.error.message}`,
      };
    }

    if (
      teamResult.error ||
      !teamResult.data
    ) {
      return {
        success: false,

        error:
          teamResult.error?.message ||
          "No se encontró el equipo.",
      };
    }

    if (
      planResult.error ||
      !planResult.data
    ) {
      return {
        success: false,

        error:
          planResult.error?.message ||
          "No se encontró el servicio.",
      };
    }

    const requester =
      (
        profilesResult.data ??
        []
      ).find(
        (profile) =>
          profile.id ===
          currentAssignment.profile_id
      );

    const replacement =
      (
        profilesResult.data ??
        []
      ).find(
        (profile) =>
          profile.id ===
          cleanReplacementId
      );

    if (!requester) {
      return {
        success: false,
        error:
          "No se encontró el perfil que solicitó el cambio.",
      };
    }

    if (
      !replacement ||
      !replacement.is_active
    ) {
      return {
        success: false,
        error:
          "El reemplazo seleccionado no está disponible.",
      };
    }

    const team =
      teamResult.data;

    const plan =
      planResult.data;

    /* =====================================================
       4. CREAR NUEVA ASIGNACIÓN PENDIENTE

       La insertamos primero para no dejar el servicio sin
       reemplazo si algo falla.
    ===================================================== */

    const {
      data:
        newAssignment,

      error:
        insertError,
    } = await admin
      .from("assignments")
      .insert({
        service_plan_id:
          currentAssignment.service_plan_id,

        team_id:
          currentAssignment.team_id,

        profile_id:
          replacement.id,

        status:
          "pending",

        note:
          null,
      })
      .select("id")
      .single();

    if (
      insertError ||
      !newAssignment
    ) {
      return {
        success: false,

        error:
          `No se pudo crear la asignación del reemplazo: ${
            insertError?.message ||
            "No se creó la asignación."
          }`,
      };
    }

    /* =====================================================
       5. ELIMINAR CHECKLIST DEL SOLICITANTE
    ===================================================== */

    const {
      error:
        checklistDeleteError,
    } = await admin
      .from(
        "assignment_checklist"
      )
      .delete()
      .eq(
        "assignment_id",
        currentAssignment.id
      );

    if (
      checklistDeleteError
    ) {
      await admin
        .from("assignments")
        .delete()
        .eq(
          "id",
          newAssignment.id
        );

      return {
        success: false,

        error:
          `No se pudo limpiar la preparación anterior: ${checklistDeleteError.message}`,
      };
    }

    /* =====================================================
       6. RETIRAR ASIGNACIÓN ORIGINAL
    ===================================================== */

    const {
      error:
        deleteOriginalError,
    } = await admin
      .from("assignments")
      .delete()
      .eq(
        "id",
        currentAssignment.id
      );

    if (
      deleteOriginalError
    ) {
      await admin
        .from("assignments")
        .delete()
        .eq(
          "id",
          newAssignment.id
        );

      return {
        success: false,

        error:
          `No se pudo retirar la asignación anterior: ${deleteOriginalError.message}`,
      };
    }

    /* =====================================================
       7. ACTUALIZAR MEMBERS DEL EQUIPO
    ===================================================== */

    const currentMembers =
      Array.isArray(
        team.members
      )
        ? team.members
            .map(
              (name) =>
                String(
                  name
                ).trim()
            )
            .filter(Boolean)
        : [];

    const nextMembers =
      Array.from(
        new Set(
          currentMembers
            .filter(
              (name) =>
                name !==
                requester.full_name
            )
            .concat(
              replacement.full_name
            )
        )
      );

    const requesterWasLeader =
      team.leader_name ===
      requester.full_name;

    const {
      error:
        teamUpdateError,
    } = await admin
      .from("service_teams")
      .update({
        members:
          nextMembers,

        leader_name:
          requesterWasLeader
            ? replacement.full_name
            : team.leader_name,
      })
      .eq(
        "id",
        team.id
      );

    if (
      teamUpdateError
    ) {
      /*
       * La operación principal ya se realizó.
       * No eliminamos el reemplazo porque eso dejaría
       * nuevamente el servicio sin persona asignada.
       */
      console.error(
        "No se pudo actualizar service_teams:",
        teamUpdateError
      );
    }

    /* =====================================================
       8. NOTIFICACIONES
    ===================================================== */

    const serviceDate =
      formatServiceDate(
        plan.service_date
      );

    /*
     * PUSH AL REEMPLAZO
     */

    if (
      replacement.auth_user_id
    ) {
      try {
        await sendUserPush({
          authUserId:
            replacement.auth_user_id,

          title:
            "🤝 Nueva asignación",

          body:
            `${replacement.full_name}, has sido asignado a ${team.team_name} para ${serviceDate}.` +
            (
              team.arrival_time
                ? ` Llegada: ${team.arrival_time}.`
                : ""
            ),

          url:
            `/mi-servicio/${newAssignment.id}`,

          type:
            "service-replacement-assignment",

          entityType:
            "assignment",

          entityId:
            newAssignment.id,

          dedupeKey:
            `replacement-assignment-${newAssignment.id}`,

          tag:
            `assignment-${newAssignment.id}`,
        });
      } catch (pushError) {
        console.error(
          "REPLACEMENT PUSH ERROR:",
          pushError
        );
      }
    }

    /*
     * PUSH A QUIEN SOLICITÓ EL CAMBIO
     */

    if (
      requester.auth_user_id
    ) {
      try {
        await sendUserPush({
          authUserId:
            requester.auth_user_id,

          title:
            "✅ Cambio atendido",

          body:
            `Tu solicitud de cambio para ${team.team_name} del ${serviceDate} fue atendida por coordinación.`,

          url:
            "/mi-servicio",

          type:
            "service-change-resolved",

          entityType:
            "assignment",

          entityId:
            currentAssignment.id,

          dedupeKey:
            `change-resolved-${currentAssignment.id}`,

          tag:
            `change-resolved-${currentAssignment.id}`,
        });
      } catch (pushError) {
        console.error(
          "CHANGE RESOLVED PUSH ERROR:",
          pushError
        );
      }
    }

    /* =====================================================
       9. REVALIDAR
    ===================================================== */

    revalidateService(
      currentAssignment.service_plan_id
    );

    return {
      success: true,
      error: null,

      replacementName:
        replacement.full_name,

      newAssignmentId:
        newAssignment.id,
    };
  } catch (error) {
    console.error(
      "resolveChangeRequestAction:",
      error
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "No fue posible resolver la solicitud de cambio.",
    };
  }
}