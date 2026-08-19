"use server";

import { revalidatePath } from "next/cache";

import {
  type RoleName,
  requirePermission,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const validRoleNames: RoleName[] = [
  "admin",
  "coordinator",
  "ministry_leader",
  "team_leader",
  "server",
  "pastor",
  "new_volunteer",
];

function isValidRoleName(
  value: string
): value is RoleName {
  return validRoleNames.includes(
    value as RoleName
  );
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseMinistryScope(
  formData: FormData
) {
  return Array.from(
    new Set(
      formData
        .getAll("ministry_scope")
        .map((value) =>
          String(value).trim()
        )
        .filter(Boolean)
    )
  );
}

function revalidateUserPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/personas");
  revalidatePath("/mi-equipo");
  revalidatePath("/mi-servicio");
}

export async function updateUserAccess(
  formData: FormData
) {
  const access = await requirePermission(
    "users.manage"
  );

  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  ).trim();

  const roleName = String(
    formData.get("role_name") || ""
  ).trim();

  const isActiveValue = String(
    formData.get("is_active") || ""
  ).trim();

  const ministryScope =
    parseMinistryScope(formData);

  if (
    !profileId ||
    !isValidUuid(profileId)
  ) {
    throw new Error(
      "El perfil seleccionado no es válido."
    );
  }

  if (!isValidRoleName(roleName)) {
    throw new Error(
      "El rol seleccionado no es válido."
    );
  }

  const isActive =
    isActiveValue === "true";

  const {
    data: targetProfile,
    error: targetProfileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role_id,
      ministry_scope,
      is_active
    `)
    .eq("id", profileId)
    .maybeSingle();

  if (targetProfileError) {
    throw new Error(
      `No se pudo consultar el perfil: ${targetProfileError.message}`
    );
  }

  if (!targetProfile) {
    throw new Error(
      "No se encontró el perfil seleccionado."
    );
  }

  const {
    data: selectedRole,
    error: roleError,
  } = await admin
    .from("roles")
    .select(`
      id,
      name,
      label
    `)
    .eq("name", roleName)
    .maybeSingle();

  if (roleError) {
    throw new Error(
      `No se pudo consultar el rol: ${roleError.message}`
    );
  }

  if (!selectedRole) {
    throw new Error(
      "El rol seleccionado no existe."
    );
  }

  /*
   * Solo los responsables necesitan un alcance
   * limitado por ministerios.
   *
   * Para los demás roles dejamos el alcance vacío,
   * porque sus permisos determinan lo que pueden ver.
   */
  const roleUsesMinistryScope =
    roleName === "ministry_leader" ||
    roleName === "team_leader";

  const normalizedMinistryScope =
    roleUsesMinistryScope
      ? ministryScope
      : [];

  if (
    roleUsesMinistryScope &&
    normalizedMinistryScope.length === 0
  ) {
    throw new Error(
      "Debes seleccionar al menos un ministerio para este responsable."
    );
  }

  /*
   * Evitamos que el administrador se quite a sí mismo
   * su acceso administrativo o se desactive por accidente.
   */
  const isUpdatingOwnProfile =
    access.profileId === profileId;

  if (
    isUpdatingOwnProfile &&
    roleName !== "admin"
  ) {
    throw new Error(
      "No puedes retirar tu propio rol de administrador desde esta pantalla."
    );
  }

  if (
    isUpdatingOwnProfile &&
    !isActive
  ) {
    throw new Error(
      "No puedes desactivar tu propio perfil."
    );
  }

  const {
    error: updateError,
  } = await admin
    .from("profiles")
    .update({
      role_id: selectedRole.id,
      ministry_scope:
        normalizedMinistryScope,
      is_active: isActive,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(
      `No se pudo actualizar el acceso: ${updateError.message}`
    );
  }

  /*
   * Guardamos un registro administrativo directamente.
   * No usamos logActivity aquí para evitar depender
   * de su lista cerrada de acciones.
   */
  const {
    error: activityError,
  } = await admin
    .from("activity_log")
    .insert({
      action: "user_access_updated",
      entity_type: "profile",
      entity_id: profileId,
      profile_id: profileId,
      actor_name: access.fullName,
      description:
        `${access.fullName} actualizó el acceso de ` +
        `${targetProfile.full_name} a ${selectedRole.label}.`,
      metadata: {
        actor_profile_id:
          access.profileId,
        actor_role:
          access.roleName,
        target_profile_id:
          targetProfile.id,
        target_profile_name:
          targetProfile.full_name,
        target_profile_email:
          targetProfile.email,
        previous_role_id:
          targetProfile.role_id,
        new_role_id:
          selectedRole.id,
        new_role_name:
          selectedRole.name,
        new_role_label:
          selectedRole.label,
        previous_ministry_scope:
          targetProfile.ministry_scope ??
          [],
        new_ministry_scope:
          normalizedMinistryScope,
        previous_is_active:
          targetProfile.is_active,
        new_is_active:
          isActive,
      },
    });

  if (activityError) {
    console.error(
      "El acceso se actualizó, pero no se pudo registrar la actividad:",
      activityError.message
    );
  }

  revalidateUserPaths();

  return {
    success: true,
    profileId,
    profileName:
      targetProfile.full_name,
    roleLabel:
      selectedRole.label,
  };
}

export async function deactivateUser(
  formData: FormData
) {
  const access = await requirePermission(
    "users.manage"
  );

  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  ).trim();

  if (
    !profileId ||
    !isValidUuid(profileId)
  ) {
    throw new Error(
      "El perfil seleccionado no es válido."
    );
  }

  if (profileId === access.profileId) {
    throw new Error(
      "No puedes desactivar tu propio perfil."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      is_active
    `)
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar el perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "No se encontró el perfil seleccionado."
    );
  }

  const {
    error: updateError,
  } = await admin
    .from("profiles")
    .update({
      is_active: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(
      `No se pudo desactivar el perfil: ${updateError.message}`
    );
  }

  const {
    error: subscriptionsError,
  } = await admin
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq("profile_id", profileId);

  if (subscriptionsError) {
    console.error(
      "El perfil fue desactivado, pero no se pudieron desactivar sus notificaciones:",
      subscriptionsError.message
    );
  }

  revalidateUserPaths();

  return {
    success: true,
    profileId,
    profileName:
      profile.full_name,
  };
}

export async function reactivateUser(
  formData: FormData
) {
  await requirePermission(
    "users.manage"
  );

  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  ).trim();

  if (
    !profileId ||
    !isValidUuid(profileId)
  ) {
    throw new Error(
      "El perfil seleccionado no es válido."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email
    `)
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar el perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "No se encontró el perfil seleccionado."
    );
  }

  const {
    error: updateError,
  } = await admin
    .from("profiles")
    .update({
      is_active: true,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(
      `No se pudo reactivar el perfil: ${updateError.message}`
    );
  }

  revalidateUserPaths();

  return {
    success: true,
    profileId,
    profileName:
      profile.full_name,
  };
}