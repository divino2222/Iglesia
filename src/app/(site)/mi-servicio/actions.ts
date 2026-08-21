"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   OBTENER PERFIL AUTENTICADO
========================================================= */

async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar tu perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "Tu cuenta todavía no está vinculada con un perfil de servidor."
    );
  }

  return {
    supabase,
    profile,
  };
}

/* =========================================================
   CONFIRMAR ASISTENCIA
========================================================= */

export async function confirmAssignment(formData: FormData) {
  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  if (!assignmentId) {
    throw new Error("Falta identificar la asignación.");
  }

  const { supabase, profile } =
    await getAuthenticatedProfile();

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
      status
      `
    )
    .eq("id", assignmentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `No se pudo consultar la asignación: ${assignmentError.message}`
    );
  }

  if (!assignment) {
    throw new Error(
      "Esta asignación no existe o no pertenece a tu cuenta."
    );
  }

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      status: "confirmed",
      note: null,
    })
    .eq("id", assignment.id)
    .eq("profile_id", profile.id);

  if (updateError) {
    throw new Error(
      `No se pudo confirmar tu asistencia: ${updateError.message}`
    );
  }

  revalidatePath("/mi-servicio");
  revalidatePath("/mi-cuenta");
  revalidatePath("/admin/servir");

  redirect("/mi-servicio?confirmado=1");
}

/* =========================================================
   SOLICITAR CAMBIO
========================================================= */

export async function requestAssignmentChange(
  formData: FormData
) {
  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const note = String(
    formData.get("note") || ""
  ).trim();

  if (!assignmentId) {
    throw new Error("Falta identificar la asignación.");
  }

  if (note.length < 5) {
    throw new Error(
      "Escribe brevemente el motivo por el que necesitas un cambio."
    );
  }

  const { supabase, profile } =
    await getAuthenticatedProfile();

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
      status
      `
    )
    .eq("id", assignmentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `No se pudo consultar la asignación: ${assignmentError.message}`
    );
  }

  if (!assignment) {
    throw new Error(
      "Esta asignación no existe o no pertenece a tu cuenta."
    );
  }

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      status: "change_requested",
      note,
    })
    .eq("id", assignment.id)
    .eq("profile_id", profile.id);

  if (updateError) {
    throw new Error(
      `No se pudo enviar la solicitud: ${updateError.message}`
    );
  }

  revalidatePath("/mi-servicio");
  revalidatePath("/mi-cuenta");
  revalidatePath("/admin/servir");

  redirect("/mi-servicio?cambio=1");
}

/* =========================================================
   CHECKLIST PERSONAL
========================================================= */

export async function toggleChecklistItem(
  formData: FormData
) {
  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const item = String(
    formData.get("item") || ""
  ).trim();

  const completed =
    String(
      formData.get("completed") || ""
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

  const { supabase, profile } =
    await getAuthenticatedProfile();

  /*
   * Comprobamos nuevamente que esta asignación
   * pertenezca al usuario autenticado.
   */
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
      team_id
      `
    )
    .eq("id", assignmentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `No se pudo validar la asignación: ${assignmentError.message}`
    );
  }

  if (!assignment) {
    throw new Error(
      "Esta asignación no existe o no pertenece a tu cuenta."
    );
  }

  /*
   * Revisamos si la tarea ya tiene progreso guardado.
   */
  const {
    data: existingItem,
    error: existingItemError,
  } = await supabase
    .from("assignment_checklist")
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
    .eq("item", item)
    .maybeSingle();

  if (existingItemError) {
    throw new Error(
      `No se pudo consultar la tarea: ${existingItemError.message}`
    );
  }

  /*
   * Si ya existe, actualizamos.
   */
  if (existingItem) {
    const { error: updateError } =
      await supabase
        .from("assignment_checklist")
        .update({
          completed,
          completed_at: completed
            ? new Date().toISOString()
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
    /*
     * Si nunca se había marcado,
     * creamos el registro.
     */
    const { error: insertError } =
      await supabase
        .from("assignment_checklist")
        .insert({
          assignment_id:
            assignment.id,

          item,

          completed,

          completed_at: completed
            ? new Date().toISOString()
            : null,
        });

    if (insertError) {
      throw new Error(
        `No se pudo guardar la tarea: ${insertError.message}`
      );
    }
  }

  /*
   * Refrescamos Mi servicio.
   *
   * También dejamos listo el admin porque
   * después mostraremos ahí el progreso.
   */
  revalidatePath("/mi-servicio");
  revalidatePath("/admin/servir");
}