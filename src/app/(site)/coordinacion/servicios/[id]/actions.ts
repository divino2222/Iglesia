"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type AssignmentInput = {
  teamId: string;
  profileIds: string[];
};

export async function saveServiceAssignmentsAction(
  servicePlanId: string,
  assignments: AssignmentInput[]
) {
  await requirePermission("assignments.manage", {
    redirectTo: "/sin-acceso",
  });

  const admin = createAdminClient();

  const teamIds = assignments.map(
    (assignment) => assignment.teamId
  );

  const { error: deleteError } = await admin
    .from("service_assignments")
    .delete()
    .eq("service_plan_id", servicePlanId)
    .in("team_id", teamIds);

  if (deleteError) {
    return {
      success: false,
      error: `No se pudieron limpiar las asignaciones anteriores: ${deleteError.message}`,
    };
  }

  const rows = assignments.flatMap(
    (assignment) =>
      assignment.profileIds.map(
        (profileId) => ({
          service_plan_id: servicePlanId,
          team_id: assignment.teamId,
          profile_id: profileId,
          role: "integrante",
          status: "pending",
        })
      )
  );

  if (rows.length > 0) {
    const { error: insertError } = await admin
      .from("service_assignments")
      .insert(rows);

    if (insertError) {
      return {
        success: false,
        error: `No se pudieron guardar las asignaciones: ${insertError.message}`,
      };
    }
  }

  for (const assignment of assignments) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("full_name")
      .in("id", assignment.profileIds);

    const memberNames =
      profiles?.map(
        (profile) => profile.full_name
      ) ?? [];

    await admin
      .from("service_teams")
      .update({
        members: memberNames,
        status:
          memberNames.length > 0
            ? "assigned"
            : "pending",
      })
      .eq("id", assignment.teamId);
  }

  revalidatePath(
    `/coordinacion/servicios/${servicePlanId}`
  );
  revalidatePath("/coordinacion");
  revalidatePath("/mi-ministerio");
  revalidatePath("/mi-servicio");

  return {
    success: true,
    error: null,
  };
}