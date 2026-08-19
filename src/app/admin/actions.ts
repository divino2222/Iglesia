"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity-log";
import { createAdminClient } from "@/lib/supabase/admin";

type ResolutionAction =
  | "resolved"
  | "reopen";

function isResolutionAction(
  value: string
): value is ResolutionAction {
  return (
    value === "resolved" ||
    value === "reopen"
  );
}

function revalidateAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/servir");
  revalidatePath("/mi-servicio");
  revalidatePath("/servir");
}

export async function updateChangeRequest(
  formData: FormData
) {
  const access = await requirePermission(
    "change_requests.manage"
  );

  const admin = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const requestedAction = String(
    formData.get("action") || ""
  ).trim();

  const resolutionNote =
    String(
      formData.get("resolution_note") || ""
    ).trim() || null;

  if (!assignmentId) {
    throw new Error(
      "Falta identificar la solicitud."
    );
  }

  if (
    !isResolutionAction(
      requestedAction
    )
  ) {
    throw new Error(
      "La acción seleccionada no es válida."
    );
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      status,
      note,
      profile_id,
      team_id,
      service_plan_id,
      resolution_status,
      resolution_note
    `)
    .eq("id", assignmentId)
    .single();

  if (
    assignmentError ||
    !assignment
  ) {
    throw new Error(
      `No se pudo consultar la solicitud: ${
        assignmentError?.message ||
        "Solicitud no encontrada."
      }`
    );
  }

  if (
    assignment.status !==
    "change_requested"
  ) {
    throw new Error(
      "Esta asignación no corresponde a una solicitud de cambio."
    );
  }

  const [
    profileResult,
    teamResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, full_name"
      )
      .eq(
        "id",
        assignment.profile_id
      )
      .single(),

    admin
      .from("service_teams")
      .select(
        "id, team_name"
      )
      .eq(
        "id",
        assignment.team_id
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

  const profile =
    profileResult.data;

  const team =
    teamResult.data;

  const isResolving =
    requestedAction ===
    "resolved";

  const now =
    new Date().toISOString();

  const updatedValues = {
    resolution_status:
      isResolving
        ? "resolved"
        : "open",
    resolution_note:
      resolutionNote,
    resolved_at:
      isResolving
        ? now
        : null,
    resolved_by:
      isResolving
        ? access.fullName
        : null,
    updated_at: now,
  };

  const { error: updateError } =
    await admin
      .from(
        "service_assignments"
      )
      .update(updatedValues)
      .eq("id", assignmentId);

  if (updateError) {
    throw new Error(
      `No se pudo actualizar la solicitud: ${updateError.message}`
    );
  }

  await logActivity({
    action: isResolving
      ? "resolved_change_request"
      : "reopened_change_request",
    entityType:
      "service_assignment",
    entityId:
      assignment.id,
    servicePlanId:
      assignment.service_plan_id,
    teamId:
      assignment.team_id,
    profileId:
      assignment.profile_id,
    actorName:
      access.fullName,
    description:
      isResolving
        ? `${access.fullName} resolvió la solicitud de cambio de ${profile.full_name} en ${team.team_name}.`
        : `${access.fullName} reabrió la solicitud de cambio de ${profile.full_name} en ${team.team_name}.`,
    metadata: {
      actor_profile_id:
        access.profileId,
      actor_role:
        access.roleName,
      actor_role_label:
        access.roleLabel,
      person_name:
        profile.full_name,
      team_name:
        team.team_name,
      original_note:
        assignment.note,
      resolution_note:
        resolutionNote,
      previous_resolution_status:
        assignment.resolution_status ??
        "open",
      current_resolution_status:
        updatedValues.resolution_status,
    },
  });

  revalidateAdminPaths();
}