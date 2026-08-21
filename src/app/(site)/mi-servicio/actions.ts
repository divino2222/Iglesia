"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { sendCoordinatorPush } from "@/lib/push/send-coordinator-push";

/* =========================================================
   TIPOS
========================================================= */

type AssignmentResponse =
  | "confirmed"
  | "change_requested";

type AssignmentActionResult = {
  success: boolean;
  error?: string;
};

/* =========================================================
   OBTENER PERFIL AUTENTICADO
========================================================= */

async function getAuthenticatedProfile() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return {
      ok: false as const,
      error:
        "Debes iniciar sesión.",
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      auth_user_id,
      role
      `
    )
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (profileError) {
    return {
      ok: false as const,
      error:
        `No se pudo consultar tu perfil: ${profileError.message}`,
    };
  }

  if (!profile) {
    return {
      ok: false as const,
      error:
        "Tu cuenta todavía no está vinculada con un perfil de servidor.",
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
    profile,
  };
}

/* =========================================================
   VALIDAR ASIGNACIÓN DEL USUARIO
========================================================= */

async function getOwnedAssignment(
  assignmentId: string
) {
  const auth =
    await getAuthenticatedProfile();

  if (!auth.ok) {
    return auth;
  }

  const {
    supabase,
    user,
    profile,
  } = auth;

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      profile_id,
      service_plan_id,
      team_id,
      status,
      note,

      service_plans (
        id,
        service_date,
        title,
        service_time
      ),

      service_teams (
        id,
        team_name,
        emoji,
        arrival_time,
        service_time
      )
      `
    )
    .eq(
      "id",
      assignmentId
    )
    .eq(
      "profile_id",
      profile.id
    )
    .maybeSingle();

  if (assignmentError) {
    return {
      ok: false as const,
      error:
        `No se pudo consultar la asignación: ${assignmentError.message}`,
    };
  }

  if (!assignment) {
    return {
      ok: false as const,
      error:
        "Esta asignación no existe o no pertenece a tu cuenta.",
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
    profile,
    assignment,
  };
}

/* =========================================================
   FORMATEAR FECHA
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
   RESPONDER ASIGNACIÓN
========================================================= */

export async function respondToAssignmentAction(
  assignmentId: string,
  response: AssignmentResponse,
  note = ""
): Promise<AssignmentActionResult> {
  try {
    const cleanAssignmentId =
      String(
        assignmentId || ""
      ).trim();

    const cleanNote =
      String(
        note || ""
      ).trim();

    if (!cleanAssignmentId) {
      return {
        success: false,
        error:
          "Falta identificar la asignación.",
      };
    }

    if (
      response !==
        "confirmed" &&
      response !==
        "change_requested"
    ) {
      return {
        success: false,
        error:
          "La respuesta seleccionada no es válida.",
      };
    }

    if (
      response ===
        "change_requested" &&
      cleanNote.length < 5
    ) {
      return {
        success: false,
        error:
          "Escribe brevemente el motivo por el que necesitas un cambio.",
      };
    }

    const owned =
      await getOwnedAssignment(
        cleanAssignmentId
      );

    if (!owned.ok) {
      return {
        success: false,
        error:
          owned.error,
      };
    }

    const {
      supabase,
      user,
      profile,
      assignment,
    } = owned;

    /* =====================================================
       ACTUALIZAR RESPUESTA
    ====================================================== */

    const {
      error: updateError,
    } = await supabase
      .from("assignments")
      .update({
        status:
          response,

        note:
          response ===
          "change_requested"
            ? cleanNote
            : null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        assignment.id
      )
      .eq(
        "profile_id",
        profile.id
      );

    if (updateError) {
      return {
        success: false,
        error:
          response ===
          "confirmed"
            ? `No se pudo confirmar tu asistencia: ${updateError.message}`
            : `No se pudo enviar tu solicitud de cambio: ${updateError.message}`,
      };
    }

    /* =====================================================
       DATOS DE EQUIPO Y SERVICIO
    ====================================================== */

    const plan = Array.isArray(
      assignment.service_plans
    )
      ? assignment.service_plans[0]
      : assignment.service_plans;

    const team = Array.isArray(
      assignment.service_teams
    )
      ? assignment.service_teams[0]
      : assignment.service_teams;

    const serviceDate =
      formatServiceDate(
        plan?.service_date
      );

    const teamName =
      team?.team_name ||
      "su equipo";

    /* =====================================================
       PUSH A COORDINACIÓN
    ====================================================== */

    try {
      if (
        response ===
        "confirmed"
      ) {
        await sendCoordinatorPush({
          title:
            "✅ Servicio confirmado",

          body:
            `${profile.full_name} confirmó su servicio en ${teamName} para ${serviceDate}.`,

          url:
            "/admin/servir",

          type:
            "assignment-confirmed",

          entityType:
            "assignment",

          entityId:
            assignment.id,

          dedupeKey:
            `assignment-confirmed-${assignment.id}`,

          tag:
            `assignment-${assignment.id}`,

          excludeAuthUserId:
            user.id,
        });
      }

      if (
        response ===
        "change_requested"
      ) {
        await sendCoordinatorPush({
          title:
            "🔄 Solicitud de cambio",

          body:
            `${profile.full_name} solicitó un cambio en ${teamName} para ${serviceDate}. Motivo: ${cleanNote}`,

          url:
            "/admin/servir",

          type:
            "assignment-change-requested",

          entityType:
            "assignment",

          entityId:
            assignment.id,

          dedupeKey:
            `assignment-change-${assignment.id}-${Date.now()}`,

          tag:
            `assignment-change-${assignment.id}`,

          excludeAuthUserId:
            user.id,
        });
      }
    } catch (pushError) {
      /*
       * Nunca cancelamos la respuesta
       * del servidor porque falló Push.
       */
      console.error(
        "COORDINATION PUSH ERROR:",
        pushError
      );
    }

    /* =====================================================
       REFRESCAR PANTALLAS
    ====================================================== */

    revalidatePath(
      "/mi-servicio"
    );

    revalidatePath(
      "/mi-cuenta"
    );

    revalidatePath(
      "/"
    );

    revalidatePath(
      "/admin/servir"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "RESPOND TO ASSIGNMENT ERROR:",
      error
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar tu respuesta.",
    };
  }
}

/* =========================================================
   CONFIRMAR ASISTENCIA
========================================================= */

export async function confirmAssignment(
  formData: FormData
) {
  const assignmentId =
    String(
      formData.get(
        "assignment_id"
      ) || ""
    ).trim();

  const result =
    await respondToAssignmentAction(
      assignmentId,
      "confirmed"
    );

  if (!result.success) {
    throw new Error(
      result.error ||
        "No se pudo confirmar tu asistencia."
    );
  }

  redirect(
    "/mi-servicio?confirmado=1"
  );
}

/* =========================================================
   SOLICITAR CAMBIO
========================================================= */

export async function requestAssignmentChange(
  formData: FormData
) {
  const assignmentId =
    String(
      formData.get(
        "assignment_id"
      ) || ""
    ).trim();

  const note =
    String(
      formData.get(
        "note"
      ) || ""
    ).trim();

  const result =
    await respondToAssignmentAction(
      assignmentId,
      "change_requested",
      note
    );

  if (!result.success) {
    throw new Error(
      result.error ||
        "No se pudo enviar la solicitud de cambio."
    );
  }

  redirect(
    "/mi-servicio?cambio=1"
  );
}

/* =========================================================
   CHECKLIST PERSONAL
========================================================= */

export async function toggleChecklistItem(
  formData: FormData
) {
  const assignmentId =
    String(
      formData.get(
        "assignment_id"
      ) || ""
    ).trim();

  const item =
    String(
      formData.get(
        "item"
      ) || ""
    ).trim();

  const completed =
    String(
      formData.get(
        "completed"
      ) || ""
    ) === "true";

  if (!assignmentId) {
    throw new Error(
      "Falta identificar la asignación."
    );
  }

  if (!item) {
    throw new Error(
      "Falta identificar la tarea."
    );
  }

  const owned =
    await getOwnedAssignment(
      assignmentId
    );

  if (!owned.ok) {
    throw new Error(
      owned.error
    );
  }

  const {
    supabase,
    assignment,
  } = owned;

  /* =======================================================
     REVISAR SI YA EXISTE
  ======================================================= */

  const {
    data: existingItem,
    error: existingItemError,
  } = await supabase
    .from(
      "assignment_checklist"
    )
    .select(
      `
      id,
      assignment_id,
      item,
      completed
      `
    )
    .eq(
      "assignment_id",
      assignment.id
    )
    .eq(
      "item",
      item
    )
    .maybeSingle();

  if (existingItemError) {
    throw new Error(
      `No se pudo consultar la tarea: ${existingItemError.message}`
    );
  }

  /* =======================================================
     ACTUALIZAR / CREAR
  ======================================================= */

  if (existingItem) {
    const {
      error: updateError,
    } = await supabase
      .from(
        "assignment_checklist"
      )
      .update({
        completed,

        completed_at:
          completed
            ? new Date()
                .toISOString()
            : null,
      })
      .eq(
        "id",
        existingItem.id
      );

    if (updateError) {
      throw new Error(
        `No se pudo actualizar la tarea: ${updateError.message}`
      );
    }
  } else {
    const {
      error: insertError,
    } = await supabase
      .from(
        "assignment_checklist"
      )
      .insert({
        assignment_id:
          assignment.id,

        item,

        completed,

        completed_at:
          completed
            ? new Date()
                .toISOString()
            : null,
      });

    if (insertError) {
      throw new Error(
        `No se pudo guardar la tarea: ${insertError.message}`
      );
    }
  }

  /* =======================================================
     REFRESCAR
  ======================================================= */

  revalidatePath(
    "/mi-servicio"
  );

  revalidatePath(
    "/"
  );

  revalidatePath(
    "/admin/servir"
  );
}