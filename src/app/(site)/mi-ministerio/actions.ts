"use server";

import { revalidatePath } from "next/cache";

import {
  canAccessMinistry,
  requirePermission,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = {
  success: boolean;
  error: string | null;
};

type AssignmentRow = {
  id: string;
  profile_id: string;
  service_plan_id: string;
  team_id: string;
  status: string;
};

type TeamRow = {
  id: string;
  team_name: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  ministries: string[] | null;
  is_active: boolean;
};

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX");
}

function belongsToMinistry(
  profile: ProfileRow,
  ministryName: string
) {
  return (profile.ministries ?? []).some(
    (ministry) =>
      normalize(ministry) ===
      normalize(ministryName)
  );
}

async function getAuthorizedAssignment(
  assignmentId: string
) {
  const access = await requirePermission(
    "change_requests.manage",
    {
      redirectTo: "/sin-acceso",
    }
  );

  const admin = createAdminClient();

  const {
    data: assignmentData,
    error: assignmentError,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      profile_id,
      service_plan_id,
      team_id,
      status
    `)
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return {
      access,
      admin,
      assignment: null,
      team: null,
      error: assignmentError.message,
    };
  }

  if (!assignmentData) {
    return {
      access,
      admin,
      assignment: null,
      team: null,
      error: "La asignación no existe.",
    };
  }

  const assignment =
    assignmentData as AssignmentRow;

  const {
    data: teamData,
    error: teamError,
  } = await admin
    .from("service_teams")
    .select(`
      id,
      team_name
    `)
    .eq("id", assignment.team_id)
    .maybeSingle();

  if (teamError) {
    return {
      access,
      admin,
      assignment: null,
      team: null,
      error: teamError.message,
    };
  }

  if (!teamData) {
    return {
      access,
      admin,
      assignment: null,
      team: null,
      error: "El equipo de la asignación no existe.",
    };
  }

  const team = teamData as TeamRow;

  if (
    !canAccessMinistry(
      access,
      team.team_name
    )
  ) {
    return {
      access,
      admin,
      assignment: null,
      team: null,
      error:
        "No tienes acceso para administrar este ministerio.",
    };
  }

  return {
    access,
    admin,
    assignment,
    team,
    error: null,
  };
}

export async function returnAssignmentToPendingAction(
  assignmentId: string
): Promise<ActionResult> {
  const context =
    await getAuthorizedAssignment(
      assignmentId
    );

  if (
    context.error ||
    !context.assignment
  ) {
    return {
      success: false,
      error:
        context.error ||
        "No se pudo consultar la asignación.",
    };
  }

  const { error } = await context.admin
    .from("service_assignments")
    .update({
      status: "pending",
      confirmed_at: null,
      note:
        "La solicitud fue revisada por el líder y regresó a pendiente.",
    })
    .eq(
      "id",
      context.assignment.id
    );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/mi-ministerio");
  revalidatePath("/mi-servicio");
  revalidatePath("/coordinacion");

  return {
    success: true,
    error: null,
  };
}

export async function replaceAssignmentAction(
  assignmentId: string,
  replacementProfileId: string
): Promise<ActionResult> {
  const context =
    await getAuthorizedAssignment(
      assignmentId
    );

  if (
    context.error ||
    !context.assignment ||
    !context.team
  ) {
    return {
      success: false,
      error:
        context.error ||
        "No se pudo consultar la asignación.",
    };
  }

  if (!replacementProfileId) {
    return {
      success: false,
      error: "Selecciona un reemplazo.",
    };
  }

  if (
  replacementProfileId ===
  context.assignment.profile_id
) {
  revalidatePath("/mi-ministerio");
  revalidatePath("/mi-servicio");
  revalidatePath("/coordinacion");
  revalidatePath(
    `/coordinacion/servicios/${context.assignment.service_plan_id}`
  );

  return {
    success: true,
    error: null,
  };
}

  const {
    data: replacementData,
    error: replacementError,
  } = await context.admin
    .from("profiles")
    .select(`
      id,
      full_name,
      ministries,
      is_active
    `)
    .eq("id", replacementProfileId)
    .maybeSingle();

  if (replacementError) {
    return {
      success: false,
      error:
        replacementError.message,
    };
  }

  if (!replacementData) {
    return {
      success: false,
      error:
        "El reemplazo seleccionado no existe.",
    };
  }

  const replacement =
    replacementData as ProfileRow;

  if (!replacement.is_active) {
    return {
      success: false,
      error:
        "El reemplazo seleccionado no está activo.",
    };
  }

  if (
    !belongsToMinistry(
      replacement,
      context.team.team_name
    )
  ) {
    return {
      success: false,
      error:
        "El reemplazo no pertenece a este ministerio.",
    };
  }

  const {
    data: existingAssignment,
    error: existingError,
  } = await context.admin
    .from("service_assignments")
    .select("id")
    .eq(
      "service_plan_id",
      context.assignment.service_plan_id
    )
    .eq(
      "team_id",
      context.assignment.team_id
    )
    .eq(
      "profile_id",
      replacement.id
    )
    .maybeSingle();

  if (existingError) {
    return {
      success: false,
      error: existingError.message,
    };
  }

  if (existingAssignment) {
    return {
      success: false,
      error:
        "La persona seleccionada ya está asignada a este equipo.",
    };
  }

  const {
    data: originalProfile,
    error: originalProfileError,
  } = await context.admin
    .from("profiles")
    .select("full_name")
    .eq(
      "id",
      context.assignment.profile_id
    )
    .maybeSingle();

  if (originalProfileError) {
    return {
      success: false,
      error:
        originalProfileError.message,
    };
  }

  const originalName =
    originalProfile?.full_name ||
    "Servidor anterior";

  const { error: updateError } =
    await context.admin
      .from("service_assignments")
      .update({
        profile_id:
          replacement.id,
        status: "pending",
        confirmed_at: null,
        note: `Reemplaza a ${originalName}. Asignación actualizada por el líder del ministerio.`,
      })
      .eq(
        "id",
        context.assignment.id
      );

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  const {
  data: teamAssignments,
  error: teamAssignmentsError,
} = await context.admin
  .from("service_assignments")
  .select(`
    profile_id,
    profiles!service_assignments_profile_id_fkey (
      full_name
    )
  `)
  .eq(
    "service_plan_id",
    context.assignment.service_plan_id
  )
  .eq(
    "team_id",
    context.assignment.team_id
  );

  if (teamAssignmentsError) {
    return {
      success: false,
      error:
        teamAssignmentsError.message,
    };
  }

  const memberNames = (
  teamAssignments ?? []
)
  .map((row) => {
    const relation =
      Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;

    return relation?.full_name ?? null;
  })
  .filter(
    (name): name is string =>
      Boolean(name)
  );

  await context.admin
    .from("service_teams")
    .update({
      members: memberNames,
      status:
        memberNames.length > 0
          ? "assigned"
          : "pending",
    })
    .eq(
      "id",
      context.assignment.team_id
    );

  revalidatePath("/mi-ministerio");
  revalidatePath("/mi-servicio");
  revalidatePath("/coordinacion");
  revalidatePath(
    `/coordinacion/servicios/${context.assignment.service_plan_id}`
  );

  return {
    success: true,
    error: null,
  };
}