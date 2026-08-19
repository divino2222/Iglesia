"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type AssignmentResponse =
  | "confirmed"
  | "change_requested";

export async function respondToAssignmentAction(
  assignmentId: string,
  response: AssignmentResponse,
  note?: string
) {
  const access = await requirePermission(
    "own_assignments.respond",
    {
      redirectTo: "/sin-acceso",
    }
  );

  const admin = createAdminClient();

  const {
    data: assignment,
    error: assignmentError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      profile_id,
      service_plan_id,
      team_id
    `)
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return {
      success: false,
      error: assignmentError.message,
    };
  }

  if (!assignment) {
    return {
      success: false,
      error: "La asignación no existe.",
    };
  }

  if (
    assignment.profile_id !==
    access.profileId
  ) {
    return {
      success: false,
      error:
        "No puedes responder una asignación que no te pertenece.",
    };
  }

  const updateData =
    response === "confirmed"
      ? {
          status: "confirmed",
          confirmed_at:
            new Date().toISOString(),
          note: null,
        }
      : {
          status: "change_requested",
          confirmed_at: null,
          note:
            note?.trim() ||
            "Solicitó un cambio de asignación.",
        };

  const { error: updateError } =
    await admin
      .from("service_assignments")
      .update(updateData)
      .eq("id", assignmentId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  revalidatePath("/mi-servicio");
  revalidatePath("/mi-ministerio");
  revalidatePath("/coordinacion");

  return {
    success: true,
    error: null,
  };
}