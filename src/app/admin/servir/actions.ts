"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { sendNewAssignmentPush } from "@/lib/push/server";

function parseList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNextSunday(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + 7);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function formatServiceDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeMembers(members: string[] | null | undefined) {
  return [...(members ?? [])]
    .map((item) => item.trim())
    .filter(Boolean)
    .sort();
}

function listsAreEqual(
  previous: string[] | null | undefined,
  current: string[]
) {
  const previousList = normalizeMembers(previous);
  const currentList = normalizeMembers(current);

  return JSON.stringify(previousList) === JSON.stringify(currentList);
}

function revalidateServingPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/servir");
  revalidatePath("/servir");
  revalidatePath("/mi-servicio");
  revalidatePath("/mi-cuenta");
}

/* =========================================================
   SINCRONIZAR ASSIGNMENTS DE UN EQUIPO
========================================================= */

async function syncTeamAssignments({
  servicePlanId,
  teamId,
  leaderName,
  members,
}: {
  servicePlanId: string;
  teamId: string;
  leaderName: string | null;
  members: string[];
}) {
  const supabase = createAdminClient();

  /*
   * Responsable + integrantes forman las personas que
   * deben tener una asignación.
   */
  const desiredNames = Array.from(
    new Set(
      [leaderName, ...members]
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );

  /*
   * Si el equipo quedó completamente vacío,
   * eliminamos las asignaciones existentes.
   */
  if (desiredNames.length === 0) {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("service_plan_id", servicePlanId)
      .eq("team_id", teamId);

    if (error) {
      throw new Error(
        `No se pudieron limpiar las asignaciones: ${error.message}`
      );
    }

    return;
  }

  /*
   * Buscar perfiles correspondientes.
   */
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("full_name", desiredNames);

  if (profilesError) {
    throw new Error(
      `No se pudieron localizar los perfiles: ${profilesError.message}`
    );
  }

  const foundProfiles = profiles ?? [];

  /*
   * Detectamos nombres que no existen en profiles.
   * Es mejor detenernos que crear datos inconsistentes.
   */
  const foundNames = new Set(
    foundProfiles.map((profile) => profile.full_name)
  );

  const missingNames = desiredNames.filter(
    (name) => !foundNames.has(name)
  );

  if (missingNames.length > 0) {
    throw new Error(
      `No encontramos estos perfiles: ${missingNames.join(", ")}`
    );
  }

  /*
   * Asignaciones actuales del equipo.
   */
  const { data: existingAssignments, error: assignmentsError } =
    await supabase
      .from("assignments")
      .select("id,profile_id,status,note")
      .eq("service_plan_id", servicePlanId)
      .eq("team_id", teamId);

  if (assignmentsError) {
    throw new Error(
      `No se pudieron consultar las asignaciones actuales: ${assignmentsError.message}`
    );
  }

  const existing = existingAssignments ?? [];

  const desiredProfileIds = new Set(
    foundProfiles.map((profile) => profile.id)
  );

  const existingProfileIds = new Set(
    existing.map((assignment) => assignment.profile_id)
  );

  /*
   * 1. Crear únicamente personas nuevas.
   *
   * No hacemos upsert de todos para NO resetear:
   * - confirmed
   * - change_requested
   * - note
   */
  const profilesToInsert = foundProfiles.filter(
    (profile) => !existingProfileIds.has(profile.id)
  );

  if (profilesToInsert.length > 0) {
  const {
    data: insertedAssignments,
    error: insertError,
  } = await supabase
    .from("assignments")
    .insert(
      profilesToInsert.map(
        (profile) => ({
          service_plan_id:
            servicePlanId,

          team_id:
            teamId,

          profile_id:
            profile.id,

          status:
            "pending",

          note:
            null,
        })
      )
    )
    .select(
      `
      id,
      profile_id,
      service_plan_id,
      team_id
      `
    );

  if (insertError) {
    throw new Error(
      `No se pudieron crear las nuevas asignaciones: ${insertError.message}`
    );
  }

  /* =====================================================
     NOTIFICAR SOLAMENTE A LAS PERSONAS NUEVAS
  ===================================================== */

  for (
    const assignment of
    insertedAssignments ?? []
  ) {
    try {
      await sendNewAssignmentPush({
        profileId:
          assignment.profile_id,

        servicePlanId:
          assignment.service_plan_id,

        teamId:
          assignment.team_id,
      });
    } catch (pushError) {
      /*
       * IMPORTANTE:
       *
       * Si Push falla, NO cancelamos la asignación.
       * La operación principal ya quedó guardada.
       */
      console.error(
        "No se pudo enviar la notificación de nueva asignación:",
        pushError
      );
    }
  }
}

  /*
   * 2. Eliminar solamente personas retiradas del equipo.
   */
  const assignmentsToDelete = existing.filter(
    (assignment) => !desiredProfileIds.has(assignment.profile_id)
  );

  if (assignmentsToDelete.length > 0) {
    const idsToDelete = assignmentsToDelete.map(
      (assignment) => assignment.id
    );

    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      throw new Error(
        `No se pudieron eliminar asignaciones anteriores: ${deleteError.message}`
      );
    }
  }
}

/* =========================================================
   ACTUALIZAR DATOS GENERALES DEL SERVICIO
========================================================= */

export async function updateServicePlan(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Falta identificar el servicio.");
  }

  const { data: previousPlan, error: previousPlanError } = await supabase
    .from("service_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (previousPlanError || !previousPlan) {
    throw new Error(
      `No se pudo consultar el servicio: ${
        previousPlanError?.message || "Servicio no encontrado."
      }`
    );
  }

  const updatedValues = {
    title: String(formData.get("title") || "").trim(),
    service_date: String(formData.get("service_date") || "").trim(),
    service_time: String(formData.get("service_time") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    preacher: String(formData.get("preacher") || "").trim() || null,
    theme: String(formData.get("theme") || "").trim() || null,
    verse: String(formData.get("verse") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    status: String(formData.get("status") || "pending").trim(),
  };

  const { error: updateError } = await supabase
    .from("service_plans")
    .update(updatedValues)
    .eq("id", id);

  if (updateError) {
    throw new Error(`Error guardando servicio: ${updateError.message}`);
  }

  const changedFields: string[] = [];

  if (previousPlan.title !== updatedValues.title) {
    changedFields.push("título");
  }

  if (previousPlan.service_date !== updatedValues.service_date) {
    changedFields.push("fecha");
  }

  if (previousPlan.service_time !== updatedValues.service_time) {
    changedFields.push("hora");
  }

  if (previousPlan.location !== updatedValues.location) {
    changedFields.push("lugar");
  }

  if ((previousPlan.preacher ?? null) !== updatedValues.preacher) {
    changedFields.push("predicador");
  }

  if ((previousPlan.theme ?? null) !== updatedValues.theme) {
    changedFields.push("tema");
  }

  if ((previousPlan.verse ?? null) !== updatedValues.verse) {
    changedFields.push("versículo");
  }

  if ((previousPlan.notes ?? null) !== updatedValues.notes) {
    changedFields.push("notas");
  }

  if (previousPlan.status !== updatedValues.status) {
    changedFields.push("estado");
  }

  if (changedFields.length > 0) {
    await logActivity({
      action: "updated_service_plan",
      entityType: "service_plan",
      entityId: id,
      servicePlanId: id,
      actorName: "Coordinación",

      description: `Coordinación actualizó ${changedFields.join(
        ", "
      )} del servicio del ${formatServiceDate(
        updatedValues.service_date
      )}.`,

      metadata: {
        changed_fields: changedFields,

        previous: {
          title: previousPlan.title,
          service_date: previousPlan.service_date,
          service_time: previousPlan.service_time,
          location: previousPlan.location,
          preacher: previousPlan.preacher,
          theme: previousPlan.theme,
          verse: previousPlan.verse,
          notes: previousPlan.notes,
          status: previousPlan.status,
        },

        current: updatedValues,
      },
    });
  }

  revalidateServingPaths();
}

/* =========================================================
   ACTUALIZAR EQUIPO + SINCRONIZAR ASSIGNMENTS
========================================================= */

export async function updateServiceTeam(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Falta identificar el equipo.");
  }

  const { data: previousTeam, error: previousTeamError } =
    await supabase
      .from("service_teams")
      .select("*")
      .eq("id", id)
      .single();

  if (previousTeamError || !previousTeam) {
    throw new Error(
      `No se pudo consultar el equipo: ${
        previousTeamError?.message || "Equipo no encontrado."
      }`
    );
  }

  const leaderName =
    String(formData.get("leader_name") || "").trim() || null;

  const selectedMembers = Array.from(
    new Set(
      formData
        .getAll("members")
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );

  const checklist = parseList(
    String(formData.get("checklist") || "")
  );

  const updatedValues = {
    team_name: String(formData.get("team_name") || "").trim(),
    emoji: String(formData.get("emoji") || "").trim() || null,
    leader_name: leaderName,
    arrival_time:
      String(formData.get("arrival_time") || "").trim() || null,
    service_time:
      String(formData.get("service_time") || "").trim() || null,
    status: String(formData.get("status") || "pending").trim(),
    members: selectedMembers,
    checklist,
  };

  /*
   * Primero actualizamos el equipo.
   */
  const { error: updateError } = await supabase
    .from("service_teams")
    .update(updatedValues)
    .eq("id", id);

  if (updateError) {
    throw new Error(
      `Error guardando equipo: ${updateError.message}`
    );
  }

  /*
   * Después sincronizamos assignments.
   */
  await syncTeamAssignments({
    servicePlanId: previousTeam.service_plan_id,
    teamId: id,
    leaderName: updatedValues.leader_name,
    members: updatedValues.members,
  });

  const leaderChanged =
    (previousTeam.leader_name ?? null) !==
    updatedValues.leader_name;

  const membersChanged = !listsAreEqual(
    previousTeam.members,
    updatedValues.members
  );

  const generalFieldsChanged =
    previousTeam.team_name !== updatedValues.team_name ||
    (previousTeam.emoji ?? null) !== updatedValues.emoji ||
    (previousTeam.arrival_time ?? null) !==
      updatedValues.arrival_time ||
    (previousTeam.service_time ?? null) !==
      updatedValues.service_time ||
    previousTeam.status !== updatedValues.status ||
    !listsAreEqual(
      previousTeam.checklist,
      updatedValues.checklist
    );

  if (leaderChanged) {
    const leaderDescription = updatedValues.leader_name
      ? `${updatedValues.leader_name} fue asignado como responsable de ${updatedValues.team_name}.`
      : `Se retiró al responsable de ${updatedValues.team_name}.`;

    await logActivity({
      action: "assigned_leader",
      entityType: "service_team",
      entityId: id,
      servicePlanId: previousTeam.service_plan_id,
      teamId: id,
      actorName: "Coordinación",
      description: leaderDescription,

      metadata: {
        team_name: updatedValues.team_name,
        previous_leader:
          previousTeam.leader_name ?? null,
        current_leader:
          updatedValues.leader_name,
      },
    });
  }

  if (membersChanged) {
    const previousMembers = normalizeMembers(
      previousTeam.members
    );

    const currentMembers = normalizeMembers(
      updatedValues.members
    );

    const addedMembers = currentMembers.filter(
      (member) => !previousMembers.includes(member)
    );

    const removedMembers = previousMembers.filter(
      (member) => !currentMembers.includes(member)
    );

    await logActivity({
      action: "updated_members",
      entityType: "service_team",
      entityId: id,
      servicePlanId: previousTeam.service_plan_id,
      teamId: id,
      actorName: "Coordinación",

      description: `Coordinación actualizó los integrantes de ${updatedValues.team_name}.`,

      metadata: {
        team_name: updatedValues.team_name,
        previous_members: previousMembers,
        current_members: currentMembers,
        added_members: addedMembers,
        removed_members: removedMembers,
      },
    });
  }

  if (generalFieldsChanged) {
    const changedFields: string[] = [];

    if (previousTeam.team_name !== updatedValues.team_name) {
      changedFields.push("nombre");
    }

    if (
      (previousTeam.emoji ?? null) !==
      updatedValues.emoji
    ) {
      changedFields.push("emoji");
    }

    if (
      (previousTeam.arrival_time ?? null) !==
      updatedValues.arrival_time
    ) {
      changedFields.push("hora de llegada");
    }

    if (
      (previousTeam.service_time ?? null) !==
      updatedValues.service_time
    ) {
      changedFields.push("hora de servicio");
    }

    if (previousTeam.status !== updatedValues.status) {
      changedFields.push("estado");
    }

    if (
      !listsAreEqual(
        previousTeam.checklist,
        updatedValues.checklist
      )
    ) {
      changedFields.push("checklist");
    }

    await logActivity({
      action: "updated_service_team",
      entityType: "service_team",
      entityId: id,
      servicePlanId: previousTeam.service_plan_id,
      teamId: id,
      actorName: "Coordinación",

      description: `Coordinación actualizó ${changedFields.join(
        ", "
      )} del equipo ${updatedValues.team_name}.`,

      metadata: {
        team_name: updatedValues.team_name,
        changed_fields: changedFields,

        previous: {
          team_name: previousTeam.team_name,
          emoji: previousTeam.emoji,
          arrival_time: previousTeam.arrival_time,
          service_time: previousTeam.service_time,
          status: previousTeam.status,
          checklist: previousTeam.checklist ?? [],
        },

        current: {
          team_name: updatedValues.team_name,
          emoji: updatedValues.emoji,
          arrival_time: updatedValues.arrival_time,
          service_time: updatedValues.service_time,
          status: updatedValues.status,
          checklist: updatedValues.checklist,
        },
      },
    });
  }

  revalidateServingPaths();
}

/* =========================================================
   VINCULAR PERFIL CON SUPABASE AUTH
========================================================= */

export async function linkProfileAccount(
  formData: FormData
) {
  const supabase = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  ).trim();

  const authUserId = String(
    formData.get("auth_user_id") || ""
  ).trim();

  if (!profileId) {
    throw new Error("Falta identificar el perfil.");
  }

  const {
    data: previousProfile,
    error: previousProfileError,
  } = await supabase
    .from("profiles")
    .select(
      "id,full_name,auth_user_id,email"
    )
    .eq("id", profileId)
    .single();

  if (
    previousProfileError ||
    !previousProfile
  ) {
    throw new Error(
      `No se pudo consultar el perfil: ${
        previousProfileError?.message ||
        "Perfil no encontrado."
      }`
    );
  }

  let email: string | null = null;

  if (authUserId) {
    const { data, error } =
      await supabase.auth.admin.getUserById(
        authUserId
      );

    if (error) {
      throw new Error(
        `No se pudo consultar la cuenta seleccionada: ${error.message}`
      );
    }

    email = data.user?.email ?? null;

    const {
      data: alreadyLinked,
      error: alreadyLinkedError,
    } = await supabase
      .from("profiles")
      .select("id,full_name")
      .eq("auth_user_id", authUserId)
      .neq("id", profileId)
      .maybeSingle();

    if (alreadyLinkedError) {
      throw new Error(
        `No se pudo comprobar la vinculación: ${alreadyLinkedError.message}`
      );
    }

    if (alreadyLinked) {
      throw new Error(
        `Esta cuenta ya está vinculada con ${alreadyLinked.full_name}.`
      );
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      auth_user_id:
        authUserId || null,
      email,
    })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(
      `No se pudo vincular la cuenta: ${updateError.message}`
    );
  }

  const previousAuthUserId =
    previousProfile.auth_user_id ?? null;

  const currentAuthUserId =
    authUserId || null;

  if (
    previousAuthUserId !==
    currentAuthUserId
  ) {
    await logActivity({
      action: currentAuthUserId
        ? "linked_profile_account"
        : "unlinked_profile_account",

      entityType: "profile",
      entityId: profileId,
      actorName: "Coordinación",

      description: currentAuthUserId
        ? `${previousProfile.full_name} fue vinculado con la cuenta ${
            email ?? "registrada"
          }.`
        : `Se desvinculó la cuenta de ${previousProfile.full_name}.`,

      metadata: {
        profile_name:
          previousProfile.full_name,

        previous_auth_user_id:
          previousAuthUserId,

        current_auth_user_id:
          currentAuthUserId,

        previous_email:
          previousProfile.email ?? null,

        current_email: email,
      },
    });
  }

  revalidateServingPaths();
}


/* =========================================================
   GESTIONAR SOLICITUDES DE CAMBIO
========================================================= */

export async function keepAssignmentPending(formData: FormData) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  if (!assignmentId) {
    throw new Error("Falta identificar la asignación.");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,profile_id,team_id,service_plan_id,status,note")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(
      `No se pudo consultar la asignación: ${
        assignmentError?.message || "Asignación no encontrada."
      }`
    );
  }

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      status: "pending",
      note: null,
    })
    .eq("id", assignmentId);

  if (updateError) {
    throw new Error(
      `No se pudo mantener la asignación: ${updateError.message}`
    );
  }

  await logActivity({
    action: "kept_assignment_pending",
    entityType: "assignment",
    entityId: assignmentId,
    servicePlanId: assignment.service_plan_id,
    teamId: assignment.team_id,
    actorName: "Coordinación",
    description:
      "Coordinación mantuvo la asignación y la dejó pendiente de confirmación.",
    metadata: {
      profile_id: assignment.profile_id,
      previous_status: assignment.status,
      previous_note: assignment.note,
      current_status: "pending",
    },
  });

  revalidateServingPaths();
}

export async function resolveAssignmentChange(formData: FormData) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  if (!assignmentId) {
    throw new Error("Falta identificar la asignación.");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,profile_id,team_id,service_plan_id,status,note")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(
      `No se pudo consultar la asignación: ${
        assignmentError?.message || "Asignación no encontrada."
      }`
    );
  }

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      status: "confirmed",
      note: null,
    })
    .eq("id", assignmentId);

  if (updateError) {
    throw new Error(
      `No se pudo resolver la solicitud: ${updateError.message}`
    );
  }

  await logActivity({
    action: "resolved_assignment_change",
    entityType: "assignment",
    entityId: assignmentId,
    servicePlanId: assignment.service_plan_id,
    teamId: assignment.team_id,
    actorName: "Coordinación",
    description:
      "Coordinación resolvió la solicitud de cambio y dejó la asignación confirmada.",
    metadata: {
      profile_id: assignment.profile_id,
      previous_status: assignment.status,
      previous_note: assignment.note,
      current_status: "confirmed",
    },
  });

  revalidateServingPaths();
}

export async function reassignAssignment(formData: FormData) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const newProfileId = String(
    formData.get("new_profile_id") || ""
  ).trim();

  if (!assignmentId || !newProfileId) {
    throw new Error("Falta información para reasignar el servicio.");
  }

  const { data: currentAssignment, error: currentAssignmentError } =
    await supabase
      .from("assignments")
      .select("id,profile_id,team_id,service_plan_id,status,note")
      .eq("id", assignmentId)
      .single();

  if (currentAssignmentError || !currentAssignment) {
    throw new Error(
      `No se pudo consultar la asignación: ${
        currentAssignmentError?.message || "Asignación no encontrada."
      }`
    );
  }

  if (currentAssignment.profile_id === newProfileId) {
    throw new Error(
      "Selecciona una persona diferente para realizar la reasignación."
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", [currentAssignment.profile_id, newProfileId]);

  if (profilesError) {
    throw new Error(
      `No se pudieron consultar los perfiles: ${profilesError.message}`
    );
  }

  const oldProfile = (profiles ?? []).find(
    (profile) => profile.id === currentAssignment.profile_id
  );

  const newProfile = (profiles ?? []).find(
    (profile) => profile.id === newProfileId
  );

  if (!oldProfile) {
    throw new Error("No se encontró el perfil de la persona actual.");
  }

  if (!newProfile) {
    throw new Error("No se encontró el perfil del reemplazo.");
  }

  const { data: team, error: teamError } = await supabase
    .from("service_teams")
    .select("id,team_name,leader_name,members")
    .eq("id", currentAssignment.team_id)
    .single();

  if (teamError || !team) {
    throw new Error(
      `No se pudo consultar el equipo: ${
        teamError?.message || "Equipo no encontrado."
      }`
    );
  }

  const currentMembers = Array.isArray(team.members)
    ? team.members.map((name) => String(name))
    : [];

  const oldWasLeader = team.leader_name === oldProfile.full_name;

  let updatedLeaderName = team.leader_name;
  let updatedMembers = currentMembers;

  if (oldWasLeader) {
    updatedLeaderName = newProfile.full_name;

    /*
     * Si el responsable anterior también estaba repetido entre integrantes,
     * lo sustituimos para mantener la lista consistente.
     */
    updatedMembers = currentMembers.map((name) =>
      name === oldProfile.full_name ? newProfile.full_name : name
    );
  } else {
    updatedMembers = currentMembers
      .filter((name) => name !== oldProfile.full_name)
      .concat(newProfile.full_name);
  }

  updatedMembers = Array.from(
    new Set(updatedMembers.map((name) => name.trim()).filter(Boolean))
  );

  const { error: teamUpdateError } = await supabase
    .from("service_teams")
    .update({
      leader_name: updatedLeaderName,
      members: updatedMembers,
    })
    .eq("id", currentAssignment.team_id);

  if (teamUpdateError) {
    throw new Error(
      `No se pudo actualizar el equipo: ${teamUpdateError.message}`
    );
  }

  const { data: existingReplacementAssignment, error: existingError } =
    await supabase
      .from("assignments")
      .select("id")
      .eq("service_plan_id", currentAssignment.service_plan_id)
      .eq("team_id", currentAssignment.team_id)
      .eq("profile_id", newProfileId)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `No se pudo verificar al reemplazo: ${existingError.message}`
    );
  }

  const { error: deleteError } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);

  if (deleteError) {
    throw new Error(
      `No se pudo retirar la asignación anterior: ${deleteError.message}`
    );
  }

  if (!existingReplacementAssignment) {
    const { error: insertError } = await supabase
      .from("assignments")
      .insert({
        service_plan_id: currentAssignment.service_plan_id,
        team_id: currentAssignment.team_id,
        profile_id: newProfileId,
        status: "pending",
        note: null,
      });

    if (insertError) {
      throw new Error(
        `No se pudo crear la asignación del reemplazo: ${insertError.message}`
      );
    }
  }

  await logActivity({
    action: "reassigned_assignment",
    entityType: "assignment",
    entityId: assignmentId,
    servicePlanId: currentAssignment.service_plan_id,
    teamId: currentAssignment.team_id,
    actorName: "Coordinación",
    description: `Coordinación reasignó ${team.team_name} de ${oldProfile.full_name} a ${newProfile.full_name}.`,
    metadata: {
      team_name: team.team_name,
      previous_profile_id: oldProfile.id,
      previous_profile_name: oldProfile.full_name,
      new_profile_id: newProfile.id,
      new_profile_name: newProfile.full_name,
      previous_status: currentAssignment.status,
      previous_note: currentAssignment.note,
      old_was_leader: oldWasLeader,
    },
  });

  revalidateServingPaths();
}

/* =========================================================
   CREAR SIGUIENTE DOMINGO
========================================================= */

export async function createNextSundayPlan(
  formData: FormData
) {
  const supabase = createAdminClient();

  const planId = String(
    formData.get("plan_id") || ""
  ).trim();

  const adminPin = String(
    formData.get("admin_pin") || ""
  ).trim();

  if (!planId) {
    throw new Error(
      "Falta identificar el plan actual."
    );
  }

  const {
    data: currentPlan,
    error: planError,
  } = await supabase
    .from("service_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !currentPlan) {
    throw new Error(
      `No se encontró el plan actual: ${
        planError?.message ||
        "Plan no disponible."
      }`
    );
  }

  const nextDate = getNextSunday(
    currentPlan.service_date
  );

  const {
    data: existingPlan,
    error: existingPlanError,
  } = await supabase
    .from("service_plans")
    .select("id")
    .eq("service_date", nextDate)
    .maybeSingle();

  if (existingPlanError) {
    throw new Error(
      `No se pudo verificar el próximo domingo: ${existingPlanError.message}`
    );
  }

  if (existingPlan) {
    revalidateServingPaths();

    redirect(
      `/admin/servir?pin=${encodeURIComponent(
        adminPin
      )}&plan=${existingPlan.id}`
    );
  }

  const {
    data: newPlan,
    error: insertPlanError,
  } = await supabase
    .from("service_plans")
    .insert({
      service_date: nextDate,
      title: currentPlan.title,
      service_time:
        currentPlan.service_time,
      location:
        currentPlan.location,
      preacher: null,
      theme: null,
      verse: currentPlan.verse,
      notes: currentPlan.notes,
      status: "pending",
    })
    .select("*")
    .single();

  if (
    insertPlanError ||
    !newPlan
  ) {
    throw new Error(
      `Error creando próximo domingo: ${
        insertPlanError?.message ||
        "No se creó el servicio."
      }`
    );
  }

  const {
    data: currentTeams,
    error: teamsError,
  } = await supabase
    .from("service_teams")
    .select("*")
    .eq("service_plan_id", planId);

  if (teamsError) {
    await supabase
      .from("service_plans")
      .delete()
      .eq("id", newPlan.id);

    throw new Error(
      `Error leyendo equipos: ${teamsError.message}`
    );
  }

  const newTeams = (
    currentTeams ?? []
  ).map((team) => ({
    service_plan_id: newPlan.id,
    team_name: team.team_name,
    emoji: team.emoji,
    leader_name: null,
    arrival_time: team.arrival_time,
    service_time: team.service_time,
    status: "pending",
    members: [],
    checklist:
      team.checklist ?? [],
  }));

  if (newTeams.length > 0) {
    const {
      error: insertTeamsError,
    } = await supabase
      .from("service_teams")
      .insert(newTeams);

    if (insertTeamsError) {
      await supabase
        .from("service_plans")
        .delete()
        .eq("id", newPlan.id);

      throw new Error(
        `Error creando equipos: ${insertTeamsError.message}`
      );
    }
  }

  await logActivity({
    action: "created_service_plan",
    entityType: "service_plan",
    entityId: newPlan.id,
    servicePlanId: newPlan.id,
    actorName: "Coordinación",

    description: `Coordinación creó el servicio del ${formatServiceDate(
      nextDate
    )}.`,

    metadata: {
      duplicated_from_plan_id:
        currentPlan.id,
      service_date: nextDate,
      title: newPlan.title,
      service_time:
        newPlan.service_time,
      location:
        newPlan.location,
      copied_teams:
        newTeams.length,
    },
  });

  revalidateServingPaths();

  redirect(
    `/admin/servir?pin=${encodeURIComponent(
      adminPin
    )}&plan=${newPlan.id}`
  );
}