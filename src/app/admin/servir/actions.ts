"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendUserPush } from "@/lib/push/send-user-push";

/* =========================================================
   HELPERS
========================================================= */

function parseList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function revalidateServingPaths() {
  revalidatePath("/servir");
  revalidatePath("/admin/servir");
  revalidatePath("/mi-cuenta");
}

function getNextSundayDate(date: string) {
  const current = new Date(`${date}T12:00:00`);
  current.setDate(current.getDate() + 7);

  return current.toISOString().slice(0, 10);
}

/* =========================================================
   ACTUALIZAR SERVICIO
========================================================= */

export async function updateServicePlan(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "");

  const { error } = await supabase
    .from("service_plans")
    .update({
      title: String(formData.get("title") || ""),

      service_date: String(
        formData.get("service_date") || ""
      ),

      service_time: String(
        formData.get("service_time") || ""
      ),

      location: String(
        formData.get("location") || ""
      ),

      preacher:
        String(formData.get("preacher") || "") ||
        null,

      theme:
        String(formData.get("theme") || "") ||
        null,

      verse:
        String(formData.get("verse") || "") ||
        null,

      notes:
        String(formData.get("notes") || "") ||
        null,

      status: String(
        formData.get("status") || "pending"
      ),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateServingPaths();
}

/* =========================================================
   ACTUALIZAR EQUIPO
========================================================= */

export async function updateServiceTeam(
  formData: FormData
) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "");

  const leaderName = String(
    formData.get("leader_name") || ""
  ).trim();

  const selectedMembers = formData
    .getAll("members")
    .map((item) => String(item).trim())
    .filter(Boolean);

  /*
   * =======================================================
   * 1. ESTADO ANTERIOR
   * =======================================================
   */

  const {
    data: previousTeam,
    error: previousTeamError,
  } = await supabase
    .from("service_teams")
    .select(
      `
      id,
      service_plan_id,
      team_name,
      leader_name
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (previousTeamError) {
    throw new Error(previousTeamError.message);
  }

  /*
   * =======================================================
   * 2. GUARDAR CAMBIOS
   * =======================================================
   */

  const {
    data: updatedTeam,
    error: updateError,
  } = await supabase
    .from("service_teams")
    .update({
      team_name: String(
        formData.get("team_name") || ""
      ),

      emoji:
        String(formData.get("emoji") || "") ||
        null,

      leader_name: leaderName || null,

      arrival_time:
        String(
          formData.get("arrival_time") || ""
        ) || null,

      service_time:
        String(
          formData.get("service_time") || ""
        ) || null,

      status: String(
        formData.get("status") || "pending"
      ),

      members: selectedMembers,

      checklist: parseList(
        String(formData.get("checklist") || "")
      ),
    })
    .eq("id", id)
    .select(
      `
      id,
      service_plan_id,
      team_name,
      leader_name,
      arrival_time,
      service_time
      `
    )
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  /*
   * =======================================================
   * 3. ¿CAMBIÓ EL RESPONSABLE?
   * =======================================================
   */

  const previousLeader =
    previousTeam?.leader_name?.trim() || "";

  const newLeader =
    updatedTeam.leader_name?.trim() || "";

  const leaderChanged =
    previousLeader !== newLeader;

  /*
   * Si no cambió el responsable,
   * no mandamos otra "Nueva asignación".
   */
  if (leaderChanged && newLeader) {
    /*
     * =====================================================
     * 4. BUSCAR SERVIDOR
     * =====================================================
     */

    const {
      data: server,
      error: serverError,
    } = await supabase
      .from("servers")
      .select(
        `
        id,
        full_name,
        auth_user_id
        `
      )
      .eq("full_name", newLeader)
      .maybeSingle();

    if (serverError) {
      console.error(
        "SERVER LOOKUP ERROR:",
        serverError
      );
    }

    /*
     * Solo enviamos Push si esa persona
     * ya tiene cuenta vinculada.
     */
    if (server?.auth_user_id) {
      /*
       * ===================================================
       * 5. DATOS DEL DOMINGO
       * ===================================================
       */

      const { data: servicePlan } =
        await supabase
          .from("service_plans")
          .select(
            `
            id,
            service_date,
            title
            `
          )
          .eq(
            "id",
            updatedTeam.service_plan_id
          )
          .maybeSingle();

      const dateLabel =
        servicePlan?.service_date
          ? new Intl.DateTimeFormat(
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
                `${servicePlan.service_date}T12:00:00`
              )
            )
          : "el próximo servicio";

      /*
       * ===================================================
       * 6. PUSH PERSONALIZADO
       * ===================================================
       */

      const body =
        `${newLeader}, has sido asignado al equipo de ${updatedTeam.team_name} para ${dateLabel}.` +
        (updatedTeam.arrival_time
          ? ` Llegada: ${updatedTeam.arrival_time}.`
          : "");

      try {
        await sendUserPush({
          authUserId: server.auth_user_id,

          title: "🤝 Nueva asignación",

          body,

          url: "/mi-cuenta",

          type: "service-assignment",

          entityType: "service_team",

          entityId: updatedTeam.id,

          dedupeKey:
            `service-assignment-${updatedTeam.id}-${server.auth_user_id}`,

          tag:
            `service-assignment-${updatedTeam.id}`,
        });
      } catch (pushError) {
        /*
         * Una falla Push nunca debe
         * cancelar la asignación.
         */
        console.error(
          "ASSIGNMENT PUSH ERROR:",
          pushError
        );
      }
    }
  }

  revalidateServingPaths();
}

/* =========================================================
   VINCULAR PERFIL / SERVIDOR CON AUTH
========================================================= */

export async function linkProfileAccount(
  formData: FormData
) {
  const supabase = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  );

  const authUserId = String(
    formData.get("auth_user_id") || ""
  );

  if (!profileId) {
    throw new Error(
      "No se recibió el servidor a vincular."
    );
  }

  /*
   * DESVINCULAR
   */

  if (!authUserId) {
    const { error } = await supabase
      .from("servers")
      .update({
        auth_user_id: null,
        email: null,
      })
      .eq("id", profileId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServingPaths();
    return;
  }

  /*
   * BUSCAR CUENTA AUTH
   */

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.admin.getUserById(
    authUserId
  );

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error(
      "No se encontró la cuenta seleccionada."
    );
  }

  /*
   * VINCULAR
   */

  const { error } = await supabase
    .from("servers")
    .update({
      auth_user_id: authData.user.id,
      email: authData.user.email ?? null,
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateServingPaths();
}

/* =========================================================
   MANTENER ASIGNACIÓN PENDIENTE
========================================================= */

export async function keepAssignmentPending(
  formData: FormData
) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  );

  if (!assignmentId) {
    throw new Error(
      "No se recibió la asignación."
    );
  }

  const { error } = await supabase
    .from("service_assignments")
    .update({
      status: "pending",
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateServingPaths();
}

/* =========================================================
   MANTENER Y CONFIRMAR ASIGNACIÓN
========================================================= */

export async function resolveAssignmentChange(
  formData: FormData
) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  );

  if (!assignmentId) {
    throw new Error(
      "No se recibió la asignación."
    );
  }

  const { error } = await supabase
    .from("service_assignments")
    .update({
      status: "confirmed",
      note: null,
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateServingPaths();
}

/* =========================================================
   REASIGNAR SERVICIO
========================================================= */

export async function reassignAssignment(
  formData: FormData
) {
  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  );

  const newProfileId = String(
    formData.get("new_profile_id") || ""
  );

  if (!assignmentId || !newProfileId) {
    throw new Error(
      "Faltan datos para realizar la reasignación."
    );
  }

  /*
   * Obtener asignación actual para conocer
   * el equipo y poder notificar al reemplazo.
   */

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from("service_assignments")
    .select(
      `
      id,
      team_id
      `
    )
    .eq("id", assignmentId)
    .single();

  if (assignmentError) {
    throw new Error(
      assignmentError.message
    );
  }

  /*
   * Actualizar persona.
   */

  const { error: updateError } =
    await supabase
      .from("service_assignments")
      .update({
        profile_id: newProfileId,
        status: "pending",
        note: null,
      })
      .eq("id", assignmentId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  /*
   * Obtener nuevo servidor.
   */

  const {
    data: newServer,
    error: serverError,
  } = await supabase
    .from("servers")
    .select(
      `
      id,
      full_name,
      auth_user_id
      `
    )
    .eq("id", newProfileId)
    .maybeSingle();

  if (serverError) {
    console.error(
      "REASSIGN SERVER ERROR:",
      serverError
    );
  }

  /*
   * Push al nuevo servidor,
   * si tiene cuenta vinculada.
   */

  if (newServer?.auth_user_id) {
    const {
      data: team,
    } = await supabase
      .from("service_teams")
      .select(
        `
        id,
        team_name,
        arrival_time,
        service_plan_id
        `
      )
      .eq("id", assignment.team_id)
      .maybeSingle();

    let dateLabel =
      "el próximo servicio";

    if (team?.service_plan_id) {
      const {
        data: servicePlan,
      } = await supabase
        .from("service_plans")
        .select("service_date")
        .eq(
          "id",
          team.service_plan_id
        )
        .maybeSingle();

      if (servicePlan?.service_date) {
        dateLabel =
          new Intl.DateTimeFormat(
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
              `${servicePlan.service_date}T12:00:00`
            )
          );
      }
    }

    try {
      await sendUserPush({
        authUserId:
          newServer.auth_user_id,

        title:
          "🤝 Nueva asignación",

        body:
          `${newServer.full_name}, has sido asignado al equipo de ${
            team?.team_name ||
            "servicio"
          } para ${dateLabel}.` +
          (team?.arrival_time
            ? ` Llegada: ${team.arrival_time}.`
            : ""),

        url: "/mi-cuenta",

        type:
          "service-reassignment",

        entityType:
          "service_assignment",

        entityId:
          assignmentId,

        dedupeKey:
          `service-reassignment-${assignmentId}-${newServer.auth_user_id}-${Date.now()}`,

        tag:
          `service-reassignment-${assignmentId}`,
      });
    } catch (pushError) {
      console.error(
        "REASSIGNMENT PUSH ERROR:",
        pushError
      );
    }
  }

  revalidateServingPaths();
}

/* =========================================================
   CREAR PRÓXIMO DOMINGO
========================================================= */

export async function createNextSundayPlan(
  formData: FormData
) {
  const supabase = createAdminClient();

  const currentPlanId = String(
    formData.get("plan_id") || ""
  );

  const adminPin = String(
    formData.get("admin_pin") || ""
  );

  if (!currentPlanId) {
    throw new Error(
      "No se recibió el plan actual."
    );
  }

  /*
   * Validamos el PIN porque esta acción
   * crea información nueva.
   */

  if (
    !process.env.SERVING_ADMIN_PIN ||
    adminPin !==
      process.env.SERVING_ADMIN_PIN
  ) {
    throw new Error(
      "No autorizado para crear un nuevo domingo."
    );
  }

  /*
   * =======================================================
   * 1. PLAN ACTUAL
   * =======================================================
   */

  const {
    data: currentPlan,
    error: planError,
  } = await supabase
    .from("service_plans")
    .select(
      `
      id,
      title,
      service_date,
      service_time,
      location,
      preacher,
      theme,
      verse,
      notes
      `
    )
    .eq("id", currentPlanId)
    .single();

  if (planError) {
    throw new Error(planError.message);
  }

  const nextDate = getNextSundayDate(
    currentPlan.service_date
  );

  /*
   * =======================================================
   * 2. ¿YA EXISTE?
   * =======================================================
   */

  const {
    data: existingPlan,
    error: existingError,
  } = await supabase
    .from("service_plans")
    .select("id")
    .eq("service_date", nextDate)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      existingError.message
    );
  }

  if (existingPlan) {
    revalidateServingPaths();

    redirect(
      `/admin/servir?pin=${encodeURIComponent(
        adminPin
      )}&plan=${encodeURIComponent(
        existingPlan.id
      )}`
    );
  }

  /*
   * =======================================================
   * 3. CREAR PLAN
   * =======================================================
   */

  const {
    data: newPlan,
    error: newPlanError,
  } = await supabase
    .from("service_plans")
    .insert({
      title:
        currentPlan.title ||
        "Servicio dominical",

      service_date: nextDate,

      service_time:
        currentPlan.service_time,

      location:
        currentPlan.location,

      preacher:
        currentPlan.preacher,

      theme:
        currentPlan.theme,

      verse:
        currentPlan.verse,

      notes:
        currentPlan.notes,

      status: "pending",
    })
    .select("id")
    .single();

  if (newPlanError) {
    throw new Error(
      newPlanError.message
    );
  }

  /*
   * =======================================================
   * 4. COPIAR EQUIPOS
   * =======================================================
   */

  const {
    data: currentTeams,
    error: teamsError,
  } = await supabase
    .from("service_teams")
    .select(
      `
      team_name,
      emoji,
      arrival_time,
      service_time,
      checklist
      `
    )
    .eq(
      "service_plan_id",
      currentPlanId
    );

  if (teamsError) {
    throw new Error(
      teamsError.message
    );
  }

  if (
    currentTeams &&
    currentTeams.length > 0
  ) {
    const copiedTeams =
      currentTeams.map((team) => ({
        service_plan_id:
          newPlan.id,

        team_name:
          team.team_name,

        emoji:
          team.emoji,

        /*
         * Por diseño:
         * próximo domingo empieza
         * sin responsable.
         */
        leader_name: null,

        arrival_time:
          team.arrival_time,

        service_time:
          team.service_time,

        status: "pending",

        /*
         * Y sin integrantes asignados.
         */
        members: [],

        /*
         * Sí conservamos las tareas
         * de cada ministerio.
         */
        checklist:
          team.checklist ?? [],
      }));

    const {
      error: insertTeamsError,
    } = await supabase
      .from("service_teams")
      .insert(copiedTeams);

    if (insertTeamsError) {
      throw new Error(
        insertTeamsError.message
      );
    }
  }

  revalidateServingPaths();

  /*
   * Abrir automáticamente el
   * domingo recién creado.
   */

  redirect(
    `/admin/servir?pin=${encodeURIComponent(
      adminPin
    )}&plan=${encodeURIComponent(
      newPlan.id
    )}`
  );
}