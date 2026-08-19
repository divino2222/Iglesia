"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAllPermissions } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = {
  error: string | null;
};

type DefaultTeam = {
  name: string;
  emoji: string;
  arrivalTime: string;
  serviceTime: string;
  checklist: string[];
};

const DEFAULT_TEAMS: DefaultTeam[] = [
  {
    name: "Alabanza",
    emoji: "🎤",
    arrivalTime: "09:30",
    serviceTime: "11:00",
    checklist: [
      "Confirmar canciones",
      "Revisar instrumentos",
      "Realizar prueba de sonido",
    ],
  },
  {
    name: "Multimedia",
    emoji: "🎥",
    arrivalTime: "09:30",
    serviceTime: "10:30",
    checklist: [
      "Encender equipo",
      "Revisar presentación",
      "Probar transmisión y audio",
    ],
  },
  {
    name: "Ujieres",
    emoji: "🚪",
    arrivalTime: "10:15",
    serviceTime: "10:30",
    checklist: [
      "Recibir personas",
      "Preparar accesos",
      "Apoyar con lugares",
    ],
  },
  {
    name: "Niños",
    emoji: "🧒",
    arrivalTime: "10:15",
    serviceTime: "11:00",
    checklist: [
      "Preparar material",
      "Revisar espacio",
      "Confirmar responsables",
    ],
  },
  {
    name: "Cafetería",
    emoji: "☕",
    arrivalTime: "10:00",
    serviceTime: "10:30",
    checklist: [
      "Preparar mesa",
      "Revisar insumos",
      "Mantener limpia el área",
    ],
  },
  {
    name: "Ofrendas",
    emoji: "🙌",
    arrivalTime: "10:30",
    serviceTime: "Durante servicio",
    checklist: [
      "Coordinar momento",
      "Confirmar responsables",
      "Apoyar con conteo",
    ],
  },
];

function getRequiredString(
  formData: FormData,
  field: string
) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function createServicePlanAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAllPermissions(
    [
      "services.create",
      "teams.manage",
    ],
    {
      redirectTo: "/sin-acceso",
    }
  );

  const serviceDate = getRequiredString(
    formData,
    "service_date"
  );

  const title = getRequiredString(
    formData,
    "title"
  );

  const serviceTime = getRequiredString(
    formData,
    "service_time"
  );

  const location = getRequiredString(
    formData,
    "location"
  );

  const preacher = getRequiredString(
    formData,
    "preacher"
  );

  const theme = getRequiredString(
    formData,
    "theme"
  );

  const verse = getRequiredString(
    formData,
    "verse"
  );

  const notes = getRequiredString(
    formData,
    "notes"
  );

  if (!serviceDate) {
    return {
      error: "Selecciona la fecha del servicio.",
    };
  }

  if (!title) {
    return {
      error: "Escribe un nombre para el servicio.",
    };
  }

  if (!serviceTime) {
    return {
      error: "Selecciona la hora del servicio.",
    };
  }

  const admin = createAdminClient();

  const {
    data: servicePlan,
    error: servicePlanError,
  } = await admin
    .from("service_plans")
    .insert({
      service_date: serviceDate,
      title,
      service_time: serviceTime,
      location:
        location || "Comunidad VID Iztapalapa",
      preacher: preacher || null,
      theme: theme || null,
      verse: verse || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (servicePlanError || !servicePlan) {
    return {
      error:
        servicePlanError?.message ||
        "No se pudo crear el servicio.",
    };
  }

  const teamsToInsert = DEFAULT_TEAMS.map(
    (team) => ({
      service_plan_id: servicePlan.id,
      team_name: team.name,
      emoji: team.emoji,
      leader_name: null,
      arrival_time: team.arrivalTime,
      service_time: team.serviceTime,
      status: "pending",
      members: [],
      checklist: team.checklist,
    })
  );

  const { error: teamsError } = await admin
    .from("service_teams")
    .insert(teamsToInsert);

  if (teamsError) {
    await admin
      .from("service_plans")
      .delete()
      .eq("id", servicePlan.id);

    return {
      error: `No se pudieron crear los equipos: ${teamsError.message}`,
    };
  }

  revalidatePath("/coordinacion");
  revalidatePath("/coordinacion/servicios");
  revalidatePath("/mi-ministerio");

  redirect(
    `/coordinacion/servicios/${servicePlan.id}`
  );
}