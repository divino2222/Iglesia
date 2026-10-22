"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/permissions";
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
  revalidatePath("/admin");
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
  await requirePermission("dashboard.view");

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
  await requirePermission("dashboard.view");

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
      .from("profiles")
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

          url: "/mi-servicio",

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
  /*
   * Vincular una cuenta con un perfil equivale a
   * otorgarle el rol de ese perfil: solo quien
   * administra usuarios puede hacerlo.
   */
  await requirePermission("users.manage");

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
      .from("profiles")
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
    .from("profiles")
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
  await requirePermission("dashboard.view");

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
    .from("assignments")
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
  await requirePermission("dashboard.view");

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
    .from("assignments")
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
  await requirePermission("dashboard.view");

  const supabase = createAdminClient();

  const assignmentId = String(
    formData.get("assignment_id") || ""
  ).trim();

  const newProfileId = String(
    formData.get("new_profile_id") || ""
  ).trim();

  if (!assignmentId || !newProfileId) {
    throw new Error(
      "Faltan datos para realizar la reasignación."
    );
  }

  /*
   * =======================================================
   * 1. ASIGNACIÓN ACTUAL
   *
   * IMPORTANTE:
   * La app actual trabaja con la tabla `assignments`.
   * =======================================================
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
      team_id,
      service_plan_id,
      status,
      note
      `
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `No se pudo consultar la asignación: ${assignmentError.message}`
    );
  }

  if (!assignment) {
    throw new Error(
      "La asignación ya no existe o no pertenece al sistema actual."
    );
  }

  if (assignment.profile_id === newProfileId) {
    throw new Error(
      "Selecciona una persona diferente para realizar la reasignación."
    );
  }

  /*
   * =======================================================
   * 2. PERSONA ACTUAL Y REEMPLAZO
   * =======================================================
   */

  const {
    data: profiles,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      auth_user_id
      `
    )
    .in("id", [
      assignment.profile_id,
      newProfileId,
    ]);

  if (profilesError) {
    throw new Error(
      `No se pudieron consultar los perfiles: ${profilesError.message}`
    );
  }

  const currentProfile =
    (profiles ?? []).find(
      (profile) =>
        profile.id === assignment.profile_id
    ) ?? null;

  const newProfile =
    (profiles ?? []).find(
      (profile) =>
        profile.id === newProfileId
    ) ?? null;

  if (!currentProfile) {
    throw new Error(
      "No se encontró el perfil de la persona asignada actualmente."
    );
  }

  if (!newProfile) {
    throw new Error(
      "No se encontró el perfil de la persona seleccionada como reemplazo."
    );
  }

  /*
   * =======================================================
   * 3. EQUIPO
   *
   * También actualizamos leader_name / members para que
   * la tarjeta del equipo y las asignaciones no se contradigan.
   * =======================================================
   */

  const {
    data: team,
    error: teamError,
  } = await supabase
    .from("service_teams")
    .select(
      `
      id,
      team_name,
      leader_name,
      members,
      arrival_time,
      service_plan_id
      `
    )
    .eq("id", assignment.team_id)
    .maybeSingle();

  if (teamError) {
    throw new Error(
      `No se pudo consultar el equipo: ${teamError.message}`
    );
  }

  if (!team) {
    throw new Error(
      "No se encontró el equipo de esta asignación."
    );
  }

  const currentMembers =
    Array.isArray(team.members)
      ? team.members
          .map((name) => String(name).trim())
          .filter(Boolean)
      : [];

  const currentWasLeader =
    team.leader_name?.trim() ===
    currentProfile.full_name.trim();

  let nextLeaderName =
    team.leader_name ?? null;

  let nextMembers =
    [...currentMembers];

  if (currentWasLeader) {
    nextLeaderName =
      newProfile.full_name;

    nextMembers =
      nextMembers.map((name) =>
        name === currentProfile.full_name
          ? newProfile.full_name
          : name
      );
  } else {
    nextMembers =
      nextMembers
        .filter(
          (name) =>
            name !==
            currentProfile.full_name
        )
        .concat(
          newProfile.full_name
        );
  }

  nextMembers =
    Array.from(
      new Set(
        nextMembers
          .map((name) => name.trim())
          .filter(Boolean)
      )
    );

  const {
    error: teamUpdateError,
  } = await supabase
    .from("service_teams")
    .update({
      leader_name:
        nextLeaderName,

      members:
        nextMembers,

      /*
       * Una reasignación necesita nueva confirmación.
       */
      status: "pending",
    })
    .eq("id", team.id);

  if (teamUpdateError) {
    throw new Error(
      `No se pudo actualizar el equipo: ${teamUpdateError.message}`
    );
  }

  /*
   * =======================================================
   * 4. EVITAR ASIGNACIONES DUPLICADAS
   * =======================================================
   */

  const {
    data: existingReplacement,
    error: existingReplacementError,
  } = await supabase
    .from("assignments")
    .select("id")
    .eq(
      "service_plan_id",
      assignment.service_plan_id
    )
    .eq(
      "team_id",
      assignment.team_id
    )
    .eq(
      "profile_id",
      newProfileId
    )
    .maybeSingle();

  if (existingReplacementError) {
    throw new Error(
      `No se pudo comprobar la asignación del reemplazo: ${existingReplacementError.message}`
    );
  }

  if (existingReplacement) {
    /*
     * El reemplazo ya estaba en el mismo equipo.
     * Eliminamos la asignación vieja y dejamos
     * la existente pendiente de confirmación.
     */
    const {
      error: deleteOldError,
    } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignment.id);

    if (deleteOldError) {
      throw new Error(
        `No se pudo retirar la asignación anterior: ${deleteOldError.message}`
      );
    }

    const {
      error: resetReplacementError,
    } = await supabase
      .from("assignments")
      .update({
        status: "pending",
        note: null,
      })
      .eq(
        "id",
        existingReplacement.id
      );

    if (resetReplacementError) {
      throw new Error(
        `No se pudo preparar la asignación del reemplazo: ${resetReplacementError.message}`
      );
    }
  } else {
    /*
     * El reemplazo todavía no estaba en el equipo:
     * reutilizamos la misma asignación y cambiamos
     * únicamente profile_id.
     */
    const {
      error: updateAssignmentError,
    } = await supabase
      .from("assignments")
      .update({
        profile_id:
          newProfileId,

        status:
          "pending",

        note:
          null,
      })
      .eq("id", assignment.id);

    if (updateAssignmentError) {
      throw new Error(
        `No se pudo reasignar el servicio: ${updateAssignmentError.message}`
      );
    }
  }

  /*
   * =======================================================
   * 5. NOTIFICACIÓN PUSH AL REEMPLAZO
   * =======================================================
   */

  if (newProfile.auth_user_id) {
    let dateLabel =
      "el próximo servicio";

    const {
      data: servicePlan,
    } = await supabase
      .from("service_plans")
      .select("service_date")
      .eq(
        "id",
        assignment.service_plan_id
      )
      .maybeSingle();

    if (servicePlan?.service_date) {
      dateLabel =
        new Intl.DateTimeFormat(
          "es-MX",
          {
            weekday:
              "long",

            day:
              "numeric",

            month:
              "long",

            timeZone:
              "America/Mexico_City",
          }
        ).format(
          new Date(
            `${servicePlan.service_date}T12:00:00`
          )
        );
    }

    try {
      await sendUserPush({
        authUserId:
          newProfile.auth_user_id,

        title:
          "🤝 Nueva asignación",

        body:
          `${newProfile.full_name}, has sido asignado al equipo de ${team.team_name} para ${dateLabel}.` +
          (team.arrival_time
            ? ` Llegada: ${team.arrival_time}.`
            : ""),

        url:
          "/mi-servicio",

        type:
          "service-reassignment",

        entityType:
          "assignment",

        entityId:
          existingReplacement?.id ??
          assignment.id,

        dedupeKey:
          `service-reassignment-${assignment.id}-${newProfile.auth_user_id}-${Date.now()}`,

        tag:
          `service-reassignment-${assignment.id}`,
      });
    } catch (pushError) {
      /*
       * Una falla Push no debe revertir la reasignación.
       */
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
  await requirePermission("dashboard.view");

  const supabase = createAdminClient();

  const currentPlanId = String(
    formData.get("plan_id") || ""
  ).trim();

  if (!currentPlanId) {
    throw new Error(
      "No se recibió el plan actual."
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
    .maybeSingle();

  if (planError) {
    throw new Error(
      `No se pudo consultar el plan actual: ${planError.message}`
    );
  }

  if (!currentPlan) {
    throw new Error(
      "No se encontró el plan actual."
    );
  }

  const nextDate =
    getNextSundayDate(
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
    .eq(
      "service_date",
      nextDate
    )
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `No se pudo verificar el próximo domingo: ${existingError.message}`
    );
  }

  if (existingPlan) {
    revalidateServingPaths();

    redirect(
      `/admin/servir?plan=${encodeURIComponent(
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

      service_date:
        nextDate,

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

      status:
        "pending",
    })
    .select("id")
    .single();

  if (
    newPlanError ||
    !newPlan
  ) {
    throw new Error(
      `No se pudo crear el próximo domingo: ${
        newPlanError?.message ||
        "No se creó el plan."
      }`
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
    await supabase
      .from("service_plans")
      .delete()
      .eq("id", newPlan.id);

    throw new Error(
      `No se pudieron consultar los equipos actuales: ${teamsError.message}`
    );
  }

  if (
    currentTeams &&
    currentTeams.length > 0
  ) {
    const copiedTeams =
      currentTeams.map(
        (team) => ({
          service_plan_id:
            newPlan.id,

          team_name:
            team.team_name,

          emoji:
            team.emoji,

          /*
           * El nuevo domingo comienza
           * sin responsable.
           */
          leader_name:
            null,

          arrival_time:
            team.arrival_time,

          service_time:
            team.service_time,

          status:
            "pending",

          /*
           * También comienza sin integrantes.
           */
          members:
            [],

          checklist:
            team.checklist ??
            [],
        })
      );

    const {
      error: insertTeamsError,
    } = await supabase
      .from("service_teams")
      .insert(copiedTeams);

    if (insertTeamsError) {
      /*
       * Si falla la copia de equipos,
       * retiramos el plan recién creado
       * para no dejar un domingo incompleto.
       */
      await supabase
        .from("service_plans")
        .delete()
        .eq("id", newPlan.id);

      throw new Error(
        `No se pudieron copiar los equipos: ${insertTeamsError.message}`
      );
    }
  }

  revalidateServingPaths();

  redirect(
    `/admin/servir?plan=${encodeURIComponent(
      newPlan.id
    )}`
  );
}
