"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity-log";
import {
  sendProfilePushNotification,
} from "@/lib/push-notifications";
import { createAdminClient } from "@/lib/supabase/admin";

type AssignmentDecision =
  | "confirmed"
  | "pending"
  | "approved_without_replacement"
  | "rejected"
  | "reassigned"
  | "reopened_change";

type ResolutionAction =
  | "approved_without_replacement"
  | "rejected"
  | "reassigned"
  | null;

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

type ResolutionStatus =
  | "open"
  | "resolved";

type AssignmentUpdate = {
  status?: AssignmentStatus;
  confirmed_at?: string | null;
  resolution_status?: ResolutionStatus;
  resolution_action?: ResolutionAction;
  resolution_note?: string | null;
  replacement_profile_id?: string | null;
  replacement_assignment_id?: string | null;
  replaced_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  updated_at: string;
};

type ProfileSummary = {
  id: string;
  full_name: string;
  email: string | null;
};

type PushQueueInput = {
  profileId: string;
  servicePlanId: string;
  assignmentId: string;
  type: string;
  title: string;
  body: string;
  url: string;
  payload?: Record<string, unknown>;
  requireInteraction?: boolean;
};

function isValidDecision(
  value: string
): value is AssignmentDecision {
  return (
    value === "confirmed" ||
    value === "pending" ||
    value === "approved_without_replacement" ||
    value === "rejected" ||
    value === "reassigned" ||
    value === "reopened_change"
  );
}

function revalidateAssignmentPaths(
  assignmentId?: string
) {
  revalidatePath("/admin");
  revalidatePath("/admin/servir");
  revalidatePath("/mi-servicio");
  revalidatePath("/servir");

  if (assignmentId) {
    revalidatePath(
      `/admin/assignment/${assignmentId}`
    );
  }
}

function removeMemberName(
  members: string[] | null,
  memberName: string
) {
  const currentMembers = Array.isArray(members)
    ? members
    : [];

  return currentMembers.filter(
    (member) => member !== memberName
  );
}

function replaceMemberName(
  members: string[] | null,
  currentName: string,
  replacementName: string
) {
  const withoutCurrentPerson =
    removeMemberName(members, currentName);

  return Array.from(
    new Set([
      ...withoutCurrentPerson,
      replacementName,
    ])
  );
}

function restoreOriginalMember(
  members: string[] | null,
  replacementName: string | null,
  originalName: string
) {
  const currentMembers = Array.isArray(members)
    ? members
    : [];

  const withoutReplacement =
    replacementName
      ? currentMembers.filter(
          (member) => member !== replacementName
        )
      : currentMembers;

  return Array.from(
    new Set([
      ...withoutReplacement,
      originalName,
    ])
  );
}

/**
 * Evita estados imposibles, por ejemplo:
 *
 * resolution_status = open
 * replacement_profile_id != null
 */
function assertConsistentUpdate(
  updateValues: AssignmentUpdate
) {
  const hasReplacementProfile =
    Boolean(
      updateValues.replacement_profile_id
    );

  const hasReplacementAssignment =
    Boolean(
      updateValues.replacement_assignment_id
    );

  const hasReplacement =
    hasReplacementProfile ||
    hasReplacementAssignment;

  if (
    updateValues.resolution_status === "open" &&
    hasReplacement
  ) {
    throw new Error(
      "Una solicitud abierta no puede conservar un reemplazo asignado."
    );
  }

  if (
    updateValues.resolution_action ===
      "reassigned" &&
    (
      updateValues.resolution_status !==
        "resolved" ||
      !hasReplacementProfile ||
      !hasReplacementAssignment
    )
  ) {
    throw new Error(
      "Una reasignación debe quedar resuelta y vinculada al reemplazo."
    );
  }

  if (
    updateValues.resolution_action !==
      "reassigned" &&
    hasReplacement
  ) {
    throw new Error(
      "Los datos de reemplazo solo pueden existir en una reasignación."
    );
  }
}

async function enqueueAndSendProfilePush({
  profileId,
  servicePlanId,
  assignmentId,
  type,
  title,
  body,
  url,
  payload = {},
  requireInteraction = false,
}: PushQueueInput) {
  const admin = createAdminClient();

  const {
    data: queuedNotification,
    error: queueError,
  } = await admin
    .from("notification_queue")
    .insert({
      type,
      service_plan_id: servicePlanId,
      assignment_id: assignmentId,
      recipient: "server",
      title,
      body,
      payload: {
        target_profile_id: profileId,
        ...payload,
      },
      sent: false,
    })
    .select("id")
    .single();

  if (queueError || !queuedNotification) {
    console.error(
      "No se pudo guardar la notificación:",
      queueError?.message ??
        "No se devolvió el registro creado."
    );

    return {
      sent: 0,
      failed: 1,
      inactive: 0,
    };
  }

  const pushResult =
    await sendProfilePushNotification(
      profileId,
      {
        title,
        body,
        url,
        type,
        servicePlanId,
        assignmentId,
        requireInteraction,
      }
    );

  if (pushResult.sent > 0) {
    const { error: sentUpdateError } =
      await admin
        .from("notification_queue")
        .update({
          sent: true,
          sent_at: new Date().toISOString(),
        })
        .eq("id", queuedNotification.id);

    if (sentUpdateError) {
      console.error(
        "El Push se envió, pero notification_queue no se actualizó:",
        sentUpdateError.message
      );
    }
  }

  return pushResult;
}

export async function reviewAssignment(
  formData: FormData
) {
  const admin = createAdminClient();

  const pin = String(
    formData.get("pin") || ""
  ).trim();

  const validPin =
    process.env.SERVING_ADMIN_PIN;

  if (!validPin || pin !== validPin) {
    throw new Error(
      "No tienes autorización para realizar esta acción."
    );
  }

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const requestedDecision = String(
    formData.get("decision") || ""
  ).trim();

  const replacementProfileId = String(
    formData.get(
      "replacement_profile_id"
    ) || ""
  ).trim();

  const coordinationNote =
    String(
      formData.get("coordination_note") ||
        ""
    ).trim() || null;

  if (!assignmentId) {
    throw new Error(
      "Falta identificar la asignación."
    );
  }

  if (!isValidDecision(requestedDecision)) {
    throw new Error(
      "La decisión seleccionada no es válida."
    );
  }

  if (
    requestedDecision === "reassigned" &&
    !replacementProfileId
  ) {
    throw new Error(
      "Debes seleccionar a la persona que cubrirá la asignación."
    );
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      service_plan_id,
      team_id,
      profile_id,
      role,
      status,
      note,
      confirmed_at,
      resolution_status,
      resolution_action,
      resolution_note,
      replacement_profile_id,
      replacement_assignment_id,
      replaced_at,
      resolved_at,
      resolved_by
    `)
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(
      `No se pudo consultar la asignación: ${
        assignmentError?.message ||
        "Asignación no encontrada."
      }`
    );
  }

  const [
    profileResult,
    teamResult,
    planResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        ministries,
        is_active
      `)
      .eq("id", assignment.profile_id)
      .single(),

    admin
      .from("service_teams")
      .select(`
        id,
        service_plan_id,
        team_name,
        emoji,
        leader_name,
        members,
        arrival_time,
        service_time,
        status
      `)
      .eq("id", assignment.team_id)
      .single(),

    admin
      .from("service_plans")
      .select(`
        id,
        service_date,
        title,
        service_time,
        location
      `)
      .eq(
        "id",
        assignment.service_plan_id
      )
      .single(),
  ]);

  if (
    profileResult.error ||
    !profileResult.data
  ) {
    throw new Error(
      `No se pudo consultar a la persona: ${
        profileResult.error?.message ||
        "Perfil no encontrado."
      }`
    );
  }

  if (
    teamResult.error ||
    !teamResult.data
  ) {
    throw new Error(
      `No se pudo consultar el equipo: ${
        teamResult.error?.message ||
        "Equipo no encontrado."
      }`
    );
  }

  if (
    planResult.error ||
    !planResult.data
  ) {
    throw new Error(
      `No se pudo consultar el servicio: ${
        planResult.error?.message ||
        "Servicio no encontrado."
      }`
    );
  }

  const profile = profileResult.data;
  const team = teamResult.data;
  const plan = planResult.data;

  const now = new Date().toISOString();

  let updateValues: AssignmentUpdate;

  let activityAction:
    | "admin_confirmed_assignment"
    | "admin_marked_pending"
    | "resolved_change_request"
    | "reopened_change_request";

  let description: string;

  let replacementProfile:
    | ProfileSummary
    | null = null;

  let previousReplacementProfile:
    | ProfileSummary
    | null = null;

  let replacementAssignmentId:
    | string
    | null = null;

  let teamWasModified = false;

  const originalWasLeader =
    assignment.role === "responsable" ||
    team.leader_name ===
      profile.full_name;

  switch (requestedDecision) {
    case "confirmed": {
      updateValues = {
        status: "confirmed",
        confirmed_at: now,
        resolution_status: "resolved",
        resolution_action: null,
        resolution_note:
          coordinationNote,
        replacement_profile_id: null,
        replacement_assignment_id: null,
        replaced_at: null,
        resolved_at: now,
        resolved_by: "Coordinación",
        updated_at: now,
      };

      activityAction =
        "admin_confirmed_assignment";

      description =
        `Coordinación confirmó la asistencia de ` +
        `${profile.full_name} en ${team.team_name}.`;

      break;
    }

    case "pending": {
      updateValues = {
        status: "pending",
        confirmed_at: null,
        resolution_status: "open",
        resolution_action: null,
        resolution_note:
          coordinationNote,
        replacement_profile_id: null,
        replacement_assignment_id: null,
        replaced_at: null,
        resolved_at: null,
        resolved_by: null,
        updated_at: now,
      };

      activityAction =
        "admin_marked_pending";

      description =
        `Coordinación dejó pendiente la respuesta de ` +
        `${profile.full_name} en ${team.team_name}.`;

      break;
    }

    case "approved_without_replacement": {
      if (
        assignment.status !==
        "change_requested"
      ) {
        throw new Error(
          "Esta asignación no tiene una solicitud de cambio activa."
        );
      }

      updateValues = {
        status: "change_requested",
        confirmed_at: null,
        resolution_status: "resolved",
        resolution_action:
          "approved_without_replacement",
        resolution_note:
          coordinationNote,
        replacement_profile_id: null,
        replacement_assignment_id: null,
        replaced_at: null,
        resolved_at: now,
        resolved_by: "Coordinación",
        updated_at: now,
      };

      activityAction =
        "resolved_change_request";

      description =
        `Coordinación aprobó la solicitud de cambio de ` +
        `${profile.full_name} en ${team.team_name} sin asignar reemplazo.`;

      break;
    }

    case "rejected": {
      if (
        assignment.status !==
        "change_requested"
      ) {
        throw new Error(
          "Esta asignación no tiene una solicitud de cambio activa."
        );
      }

      updateValues = {
        status: "confirmed",
        confirmed_at: now,
        resolution_status: "resolved",
        resolution_action: "rejected",
        resolution_note:
          coordinationNote,
        replacement_profile_id: null,
        replacement_assignment_id: null,
        replaced_at: null,
        resolved_at: now,
        resolved_by: "Coordinación",
        updated_at: now,
      };

      activityAction =
        "resolved_change_request";

      description =
        `Coordinación rechazó la solicitud de cambio de ` +
        `${profile.full_name} en ${team.team_name}.`;

      break;
    }

    case "reassigned": {
      if (
        assignment.status !==
        "change_requested"
      ) {
        throw new Error(
          "Esta asignación no tiene una solicitud de cambio activa."
        );
      }

      if (
        assignment.resolution_status ===
          "resolved" &&
        assignment.replacement_profile_id
      ) {
        throw new Error(
          "Esta solicitud ya tiene un reemplazo asignado."
        );
      }

      if (
        replacementProfileId ===
        assignment.profile_id
      ) {
        throw new Error(
          "La persona de reemplazo no puede ser la misma que solicitó el cambio."
        );
      }

      const {
        data: replacementData,
        error: replacementError,
      } = await admin
        .from("profiles")
        .select(
          "id, full_name, email"
        )
        .eq(
          "id",
          replacementProfileId
        )
        .eq("is_active", true)
        .single();

      if (
        replacementError ||
        !replacementData
      ) {
        throw new Error(
          `No se pudo consultar al reemplazo: ${
            replacementError?.message ||
            "Perfil no encontrado."
          }`
        );
      }

      replacementProfile =
        replacementData;

      /*
       * Evita asignar como reemplazo a alguien
       * que ya esté activo en otro equipo del servicio.
       */
      const {
        data: conflictingAssignments,
        error: conflictError,
      } = await admin
        .from("service_assignments")
        .select("id, team_id, status")
        .eq(
          "service_plan_id",
          assignment.service_plan_id
        )
        .eq(
          "profile_id",
          replacementProfile.id
        )
        .neq(
          "team_id",
          assignment.team_id
        )
        .in("status", [
          "pending",
          "confirmed",
          "change_requested",
        ]);

      if (conflictError) {
        throw new Error(
          `No se pudo comprobar la disponibilidad del reemplazo: ${conflictError.message}`
        );
      }

      if (
        (conflictingAssignments ?? [])
          .length > 0
      ) {
        throw new Error(
          `${replacementProfile.full_name} ya está asignado en otro equipo para este servicio.`
        );
      }

      const {
        data: replacementAssignment,
        error:
          replacementAssignmentError,
      } = await admin
        .from("service_assignments")
        .upsert(
          {
            service_plan_id:
              assignment.service_plan_id,
            team_id:
              assignment.team_id,
            profile_id:
              replacementProfile.id,
            role: originalWasLeader
              ? "responsable"
              : "integrante",
            status: "pending",
            note:
              `Reemplazo de ${profile.full_name}.`,
            confirmed_at: null,
            resolution_status: "open",
            resolution_action: null,
            resolution_note: null,
            replacement_profile_id: null,
            replacement_assignment_id: null,
            replaced_at: null,
            resolved_at: null,
            resolved_by: null,
            updated_at: now,
          },
          {
            onConflict:
              "service_plan_id,team_id,profile_id",
          }
        )
        .select("id")
        .single();

      if (
        replacementAssignmentError ||
        !replacementAssignment
      ) {
        throw new Error(
          `No se pudo crear la asignación del reemplazo: ${
            replacementAssignmentError?.message ||
            "No se creó la asignación."
          }`
        );
      }

      replacementAssignmentId =
        replacementAssignment.id;

      const updatedLeaderName =
        originalWasLeader
          ? replacementProfile.full_name
          : team.leader_name;

      const updatedMembers =
        originalWasLeader
          ? removeMemberName(
              team.members,
              profile.full_name
            )
          : replaceMemberName(
              team.members,
              profile.full_name,
              replacementProfile.full_name
            );

      const { error: teamUpdateError } =
        await admin
          .from("service_teams")
          .update({
            leader_name:
              updatedLeaderName,
            members: updatedMembers,
            status: "pending",
          })
          .eq("id", team.id);

      if (teamUpdateError) {
        await admin
          .from("service_assignments")
          .delete()
          .eq(
            "id",
            replacementAssignment.id
          );

        throw new Error(
          `No se pudo actualizar el equipo: ${teamUpdateError.message}`
        );
      }

      teamWasModified = true;

      updateValues = {
        status: "change_requested",
        confirmed_at: null,
        resolution_status: "resolved",
        resolution_action:
          "reassigned",
        resolution_note:
          coordinationNote,
        replacement_profile_id:
          replacementProfile.id,
        replacement_assignment_id:
          replacementAssignment.id,
        replaced_at: now,
        resolved_at: now,
        resolved_by: "Coordinación",
        updated_at: now,
      };

      activityAction =
        "resolved_change_request";

      description =
        `Coordinación reemplazó a ${profile.full_name} por ` +
        `${replacementProfile.full_name} en ${team.team_name}.`;

      break;
    }

    case "reopened_change": {
      if (
        assignment.status !==
        "change_requested"
      ) {
        throw new Error(
          "Esta asignación no corresponde a una solicitud de cambio."
        );
      }

      if (
        assignment.replacement_profile_id
      ) {
        const {
          data:
            previousReplacementData,
          error:
            previousReplacementError,
        } = await admin
          .from("profiles")
          .select(
            "id, full_name, email"
          )
          .eq(
            "id",
            assignment.replacement_profile_id
          )
          .maybeSingle();

        if (previousReplacementError) {
          throw new Error(
            `No se pudo consultar al reemplazo anterior: ${previousReplacementError.message}`
          );
        }

        previousReplacementProfile =
          previousReplacementData;
      }

      /*
       * Primero restauramos la composición del equipo.
       */
      const restoredLeaderName =
        originalWasLeader
          ? profile.full_name
          : team.leader_name ===
              previousReplacementProfile
                ?.full_name
            ? null
            : team.leader_name;

      const restoredMembers =
        originalWasLeader
          ? removeMemberName(
              team.members,
              previousReplacementProfile
                ?.full_name ?? ""
            )
          : restoreOriginalMember(
              team.members,
              previousReplacementProfile
                ?.full_name ?? null,
              profile.full_name
            );

      const {
        error: restoreTeamError,
      } = await admin
        .from("service_teams")
        .update({
          leader_name:
            restoredLeaderName,
          members: restoredMembers,
          status: "pending",
        })
        .eq("id", team.id);

      if (restoreTeamError) {
        throw new Error(
          `No se pudo restaurar el equipo: ${restoreTeamError.message}`
        );
      }

      teamWasModified = true;

      /*
       * Después eliminamos la asignación del reemplazo.
       */
      if (
        assignment.replacement_assignment_id
      ) {
        const {
          error:
            deleteReplacementError,
        } = await admin
          .from("service_assignments")
          .delete()
          .eq(
            "id",
            assignment.replacement_assignment_id
          );

        if (deleteReplacementError) {
          throw new Error(
            `No se pudo retirar la asignación del reemplazo: ${deleteReplacementError.message}`
          );
        }
      }

      updateValues = {
        status: "change_requested",
        confirmed_at: null,
        resolution_status: "open",
        resolution_action: null,
        resolution_note:
          coordinationNote,
        replacement_profile_id: null,
        replacement_assignment_id: null,
        replaced_at: null,
        resolved_at: null,
        resolved_by: null,
        updated_at: now,
      };

      activityAction =
        "reopened_change_request";

      description =
        `Coordinación reabrió la solicitud de cambio de ` +
        `${profile.full_name} en ${team.team_name}.`;

      break;
    }
  }

  assertConsistentUpdate(updateValues);

  const { error: updateError } =
    await admin
      .from("service_assignments")
      .update(updateValues)
      .eq("id", assignmentId);

  if (updateError) {
    /*
     * Compensación básica si falla la actualización
     * de la solicitud original después de reasignar.
     */
    if (
      requestedDecision ===
        "reassigned" &&
      replacementAssignmentId
    ) {
      await admin
        .from("service_assignments")
        .delete()
        .eq(
          "id",
          replacementAssignmentId
        );

      if (teamWasModified) {
        await admin
          .from("service_teams")
          .update({
            leader_name:
              originalWasLeader
                ? profile.full_name
                : team.leader_name,
            members:
              originalWasLeader
                ? removeMemberName(
                    team.members,
                    replacementProfile
                      ?.full_name ?? ""
                  )
                : restoreOriginalMember(
                    team.members,
                    replacementProfile
                      ?.full_name ?? null,
                    profile.full_name
                  ),
            status: team.status,
          })
          .eq("id", team.id);
      }
    }

    throw new Error(
      `No se pudo actualizar la asignación: ${updateError.message}`
    );
  }

  /*
   * Confirmación defensiva:
   * vuelve a leer la solicitud para comprobar que no
   * haya quedado abierta con datos de reemplazo.
   */
  const {
    data: verifiedAssignment,
    error: verificationError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      resolution_status,
      resolution_action,
      replacement_profile_id,
      replacement_assignment_id
    `)
    .eq("id", assignmentId)
    .single();

  if (
    verificationError ||
    !verifiedAssignment
  ) {
    throw new Error(
      `La asignación se actualizó, pero no pudo verificarse: ${
        verificationError?.message ||
        "No se encontró el registro."
      }`
    );
  }

  const verifiedHasReplacement =
    Boolean(
      verifiedAssignment
        .replacement_profile_id ||
      verifiedAssignment
        .replacement_assignment_id
    );

  if (
    verifiedHasReplacement &&
    verifiedAssignment
      .resolution_status !== "resolved"
  ) {
    throw new Error(
      "La asignación quedó en un estado inconsistente: tiene reemplazo, pero sigue abierta."
    );
  }

  if (
    verifiedAssignment
      .resolution_action ===
      "reassigned" &&
    !verifiedHasReplacement
  ) {
    throw new Error(
      "La reasignación quedó incompleta: no se guardó el vínculo con el reemplazo."
    );
  }

  await logActivity({
    action: activityAction,
    entityType:
      "service_assignment",
    entityId: assignment.id,
    servicePlanId:
      assignment.service_plan_id,
    teamId: assignment.team_id,
    profileId:
      assignment.profile_id,
    actorName: "Coordinación",
    description,
    metadata: {
      person_name:
        profile.full_name,
      person_email:
        profile.email,
      team_name:
        team.team_name,
      team_emoji:
        team.emoji,
      original_note:
        assignment.note,
      coordination_note:
        coordinationNote,
      previous_status:
        assignment.status,
      previous_resolution_status:
        assignment.resolution_status ??
        "open",
      previous_resolution_action:
        assignment.resolution_action ??
        null,
      decision:
        requestedDecision,
      replacement_profile_id:
        replacementProfile?.id ??
        null,
      replacement_profile_name:
        replacementProfile
          ?.full_name ?? null,
      replacement_profile_email:
        replacementProfile?.email ??
        null,
      previous_replacement_profile_id:
        previousReplacementProfile
          ?.id ?? null,
      previous_replacement_profile_name:
        previousReplacementProfile
          ?.full_name ?? null,
      replacement_assignment_id:
        replacementAssignmentId,
      updated_values:
        updateValues,
    },
  });

  if (
    requestedDecision ===
      "reassigned" &&
    replacementProfile &&
    replacementAssignmentId
  ) {
    await logActivity({
      action: "updated_members",
      entityType:
        "service_assignment",
      entityId:
        replacementAssignmentId,
      servicePlanId:
        assignment.service_plan_id,
      teamId:
        assignment.team_id,
      profileId:
        replacementProfile.id,
      actorName: "Coordinación",
      description:
        `${replacementProfile.full_name} fue asignado como reemplazo ` +
        `en ${team.team_name}.`,
      metadata: {
        replaced_profile_id:
          profile.id,
        replaced_profile_name:
          profile.full_name,
        replacement_profile_id:
          replacementProfile.id,
        replacement_profile_name:
          replacementProfile.full_name,
        source_assignment_id:
          assignment.id,
      },
    });
  }

  /*
   * Notificación a la persona original.
   */
  if (
    requestedDecision ===
    "approved_without_replacement"
  ) {
    await enqueueAndSendProfilePush({
      profileId: profile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "change_request_approved",
      title:
        "Solicitud aprobada",
      body:
        `Coordinación aprobó tu solicitud de cambio ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        decision:
          requestedDecision,
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });
  }

  if (
    requestedDecision === "rejected"
  ) {
    await enqueueAndSendProfilePush({
      profileId: profile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "change_request_rejected",
      title:
        "Solicitud no aprobada",
      body:
        `Coordinación rechazó tu solicitud de cambio ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        decision:
          requestedDecision,
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });
  }

  if (
    requestedDecision ===
      "reassigned" &&
    replacementProfile &&
    replacementAssignmentId
  ) {
    await enqueueAndSendProfilePush({
      profileId: profile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "replacement_confirmed",
      title:
        "Reemplazo asignado",
      body:
        `${replacementProfile.full_name} cubrirá tu lugar ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        replacement_profile_id:
          replacementProfile.id,
        replacement_profile_name:
          replacementProfile.full_name,
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });

    await enqueueAndSendProfilePush({
      profileId:
        replacementProfile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        replacementAssignmentId,
      type:
        "replacement_assigned",
      title:
        "Nueva asignación",
      body:
        `Has sido asignado para cubrir a ${profile.full_name} ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      requireInteraction: true,
      payload: {
        replaced_profile_id:
          profile.id,
        replaced_profile_name:
          profile.full_name,
        team_id: team.id,
        team_name:
          team.team_name,
        service_date:
          plan.service_date,
        arrival_time:
          team.arrival_time,
        service_time:
          team.service_time,
      },
    });
  }

  if (
    requestedDecision ===
      "reopened_change" &&
    previousReplacementProfile
  ) {
    await enqueueAndSendProfilePush({
      profileId:
        previousReplacementProfile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "replacement_cancelled",
      title:
        "Asignación retirada",
      body:
        `Coordinación retiró tu asignación como reemplazo ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        original_profile_id:
          profile.id,
        original_profile_name:
          profile.full_name,
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });

    await enqueueAndSendProfilePush({
      profileId: profile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "change_request_reopened",
      title:
        "Solicitud reabierta",
      body:
        `Coordinación reabrió tu solicitud de cambio ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });
  }

  if (
    requestedDecision === "confirmed"
  ) {
    await enqueueAndSendProfilePush({
      profileId: profile.id,
      servicePlanId:
        assignment.service_plan_id,
      assignmentId:
        assignment.id,
      type:
        "attendance_confirmed_by_admin",
      title:
        "Asistencia confirmada",
      body:
        `Coordinación confirmó tu asistencia ` +
        `en ${team.emoji || "🤝"} ${team.team_name}.`,
      url: "/mi-servicio",
      payload: {
        team_id: team.id,
        team_name:
          team.team_name,
      },
    });
  }

  revalidateAssignmentPaths(
    assignmentId
  );

  redirect(
    `/admin?pin=${encodeURIComponent(
      pin
    )}`
  );
}