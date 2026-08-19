"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";

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
  return [...(members ?? [])].map((item) => item.trim()).filter(Boolean).sort();
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
}

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
      )} del servicio del ${formatServiceDate(updatedValues.service_date)}.`,
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

export async function updateServiceTeam(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Falta identificar el equipo.");
  }

  const { data: previousTeam, error: previousTeamError } = await supabase
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

  const leaderName = String(formData.get("leader_name") || "").trim();

  const selectedMembers = Array.from(
    new Set(
      formData
        .getAll("members")
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );

  const checklist = parseList(String(formData.get("checklist") || ""));

  const updatedValues = {
    team_name: String(formData.get("team_name") || "").trim(),
    emoji: String(formData.get("emoji") || "").trim() || null,
    leader_name: leaderName || null,
    arrival_time:
      String(formData.get("arrival_time") || "").trim() || null,
    service_time:
      String(formData.get("service_time") || "").trim() || null,
    status: String(formData.get("status") || "pending").trim(),
    members: selectedMembers,
    checklist,
  };

  const { error: updateError } = await supabase
    .from("service_teams")
    .update(updatedValues)
    .eq("id", id);

  if (updateError) {
    throw new Error(`Error guardando equipo: ${updateError.message}`);
  }

  const leaderChanged =
    (previousTeam.leader_name ?? null) !== updatedValues.leader_name;

  const membersChanged = !listsAreEqual(
    previousTeam.members,
    updatedValues.members
  );

  const generalFieldsChanged =
    previousTeam.team_name !== updatedValues.team_name ||
    (previousTeam.emoji ?? null) !== updatedValues.emoji ||
    (previousTeam.arrival_time ?? null) !== updatedValues.arrival_time ||
    (previousTeam.service_time ?? null) !== updatedValues.service_time ||
    previousTeam.status !== updatedValues.status ||
    !listsAreEqual(previousTeam.checklist, updatedValues.checklist);

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
        previous_leader: previousTeam.leader_name ?? null,
        current_leader: updatedValues.leader_name,
      },
    });
  }

  if (membersChanged) {
    const previousMembers = normalizeMembers(previousTeam.members);
    const currentMembers = normalizeMembers(updatedValues.members);

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

    if ((previousTeam.emoji ?? null) !== updatedValues.emoji) {
      changedFields.push("emoji");
    }

    if (
      (previousTeam.arrival_time ?? null) !== updatedValues.arrival_time
    ) {
      changedFields.push("hora de llegada");
    }

    if (
      (previousTeam.service_time ?? null) !== updatedValues.service_time
    ) {
      changedFields.push("hora de servicio");
    }

    if (previousTeam.status !== updatedValues.status) {
      changedFields.push("estado");
    }

    if (!listsAreEqual(previousTeam.checklist, updatedValues.checklist)) {
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

export async function createNextSundayPlan(formData: FormData) {
  const supabase = createAdminClient();

  const planId = String(formData.get("plan_id") || "").trim();

  if (!planId) {
    throw new Error("Falta identificar el plan actual.");
  }

  const { data: currentPlan, error: planError } = await supabase
    .from("service_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !currentPlan) {
    throw new Error(
      `No se encontró el plan actual: ${
        planError?.message || "Plan no disponible."
      }`
    );
  }

  const nextDate = getNextSunday(currentPlan.service_date);

  const { data: existingPlan, error: existingPlanError } = await supabase
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
    throw new Error("Ya existe un plan para el próximo domingo.");
  }

  const { data: newPlan, error: insertPlanError } = await supabase
    .from("service_plans")
    .insert({
      service_date: nextDate,
      title: currentPlan.title,
      service_time: currentPlan.service_time,
      location: currentPlan.location,
      preacher: null,
      theme: null,
      verse: currentPlan.verse,
      notes: currentPlan.notes,
      status: "pending",
    })
    .select("*")
    .single();

  if (insertPlanError || !newPlan) {
    throw new Error(
      `Error creando próximo domingo: ${
        insertPlanError?.message || "No se creó el servicio."
      }`
    );
  }

  const { data: currentTeams, error: teamsError } = await supabase
    .from("service_teams")
    .select("*")
    .eq("service_plan_id", planId);

  if (teamsError) {
    throw new Error(`Error leyendo equipos: ${teamsError.message}`);
  }

  const newTeams = (currentTeams ?? []).map((team) => ({
    service_plan_id: newPlan.id,
    team_name: team.team_name,
    emoji: team.emoji,
    leader_name: null,
    arrival_time: team.arrival_time,
    service_time: team.service_time,
    status: "pending",
    members: [],
    checklist: team.checklist ?? [],
  }));

  if (newTeams.length > 0) {
    const { error: insertTeamsError } = await supabase
      .from("service_teams")
      .insert(newTeams);

    if (insertTeamsError) {
      await supabase.from("service_plans").delete().eq("id", newPlan.id);

      throw new Error(`Error creando equipos: ${insertTeamsError.message}`);
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
      duplicated_from_plan_id: currentPlan.id,
      service_date: nextDate,
      title: newPlan.title,
      service_time: newPlan.service_time,
      location: newPlan.location,
      copied_teams: newTeams.length,
    },
  });

  revalidateServingPaths();
}