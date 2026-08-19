import "server-only";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RoleName =
  | "admin"
  | "coordinator"
  | "ministry_leader"
  | "team_leader"
  | "server"
  | "pastor"
  | "new_volunteer";

export type PermissionName =
  | "dashboard.view"
  | "services.view_all"
  | "services.create"
  | "services.update"
  | "services.delete"
  | "teams.view_all"
  | "teams.view_scoped"
  | "teams.manage"
  | "assignments.manage"
  | "change_requests.manage"
  | "reports.view"
  | "users.view"
  | "users.manage"
  | "roles.manage"
  | "settings.manage"
  | "own_assignments.view"
  | "own_assignments.respond"
  | "notifications.view"
  | "profile.manage_own";

export type CurrentAccess = {
  userId: string;
  email: string;
  profileId: string;
  fullName: string;
  roleId: string;
  roleName: RoleName;
  roleLabel: string;
  ministryScope: string[];
  permissions: PermissionName[];
};

type AccessOptions = {
  redirectTo?: string;
};

type ProfileAccessRow = {
  id: string;
  full_name: string;
  email: string;
  role_id: string | null;
  ministry_scope: string[] | null;
  roles:
    | {
        id: string;
        name: string;
        label: string;
      }
    | {
        id: string;
        name: string;
        label: string;
      }[]
    | null;
};

type RolePermissionRow = {
  permissions:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function getSingleRelation<T>(
  relation: T | T[] | null
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function isRoleName(value: string): value is RoleName {
  return (
    value === "admin" ||
    value === "coordinator" ||
    value === "ministry_leader" ||
    value === "team_leader" ||
    value === "server" ||
    value === "pastor" ||
    value === "new_volunteer"
  );
}

function isPermissionName(
  value: string
): value is PermissionName {
  return (
    value === "dashboard.view" ||
    value === "services.view_all" ||
    value === "services.create" ||
    value === "services.update" ||
    value === "services.delete" ||
    value === "teams.view_all" ||
    value === "teams.view_scoped" ||
    value === "teams.manage" ||
    value === "assignments.manage" ||
    value === "change_requests.manage" ||
    value === "reports.view" ||
    value === "users.view" ||
    value === "users.manage" ||
    value === "roles.manage" ||
    value === "settings.manage" ||
    value === "own_assignments.view" ||
    value === "own_assignments.respond" ||
    value === "notifications.view" ||
    value === "profile.manage_own"
  );
}

function normalizeScope(
  scope: string[] | null | undefined
) {
  if (!Array.isArray(scope)) {
    return [];
  }

  return Array.from(
    new Set(
      scope
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export async function getCurrentAccess(): Promise<
  CurrentAccess | null
> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user?.id ||
    !user.email
  ) {
    return null;
  }

  const {
    data: profileData,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role_id,
      ministry_scope,
      roles (
        id,
        name,
        label
      )
    `)
    .eq("email", user.email)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar el acceso del perfil: ${profileError.message}`
    );
  }

  if (!profileData) {
    return null;
  }

  const profile =
    profileData as ProfileAccessRow;

  const role = getSingleRelation(
    profile.roles
  );

  if (
    !profile.role_id ||
    !role ||
    !isRoleName(role.name)
  ) {
    return null;
  }

  const {
    data: permissionRows,
    error: permissionsError,
  } = await admin
    .from("role_permissions")
    .select(`
      permissions (
        name
      )
    `)
    .eq("role_id", profile.role_id);

  if (permissionsError) {
    throw new Error(
      `No se pudieron consultar los permisos: ${permissionsError.message}`
    );
  }

  const permissions = (
    (permissionRows ?? []) as RolePermissionRow[]
  )
    .map((row) =>
      getSingleRelation(row.permissions)
    )
    .filter(
      (
        permission
      ): permission is {
        name: string;
      } => Boolean(permission)
    )
    .map((permission) => permission.name)
    .filter(isPermissionName);

  return {
    userId: user.id,
    email: user.email,
    profileId: profile.id,
    fullName: profile.full_name,
    roleId: role.id,
    roleName: role.name,
    roleLabel: role.label,
    ministryScope: normalizeScope(
      profile.ministry_scope
    ),
    permissions: Array.from(
      new Set(permissions)
    ),
  };
}

export async function requireAccess(
  options: AccessOptions = {}
): Promise<CurrentAccess> {
  const access = await getCurrentAccess();

  if (!access) {
    redirect(
      options.redirectTo ?? "/login"
    );
  }

  return access;
}

export async function hasPermission(
  permission: PermissionName,
  access?: CurrentAccess | null
) {
  const currentAccess =
    access ?? (await getCurrentAccess());

  if (!currentAccess) {
    return false;
  }

  return currentAccess.permissions.includes(
    permission
  );
}

export async function hasAnyPermission(
  permissions: PermissionName[],
  access?: CurrentAccess | null
) {
  const currentAccess =
    access ?? (await getCurrentAccess());

  if (!currentAccess) {
    return false;
  }

  return permissions.some((permission) =>
    currentAccess.permissions.includes(
      permission
    )
  );
}

export async function hasAllPermissions(
  permissions: PermissionName[],
  access?: CurrentAccess | null
) {
  const currentAccess =
    access ?? (await getCurrentAccess());

  if (!currentAccess) {
    return false;
  }

  return permissions.every((permission) =>
    currentAccess.permissions.includes(
      permission
    )
  );
}

export async function requirePermission(
  permission: PermissionName,
  options: AccessOptions = {}
): Promise<CurrentAccess> {
  const access = await requireAccess(
    options
  );

  if (
    !access.permissions.includes(
      permission
    )
  ) {
    redirect(
      options.redirectTo ??
        "/sin-acceso"
    );
  }

  return access;
}

export async function requireAnyPermission(
  permissions: PermissionName[],
  options: AccessOptions = {}
): Promise<CurrentAccess> {
  const access = await requireAccess(
    options
  );

  const allowed = permissions.some(
    (permission) =>
      access.permissions.includes(
        permission
      )
  );

  if (!allowed) {
    redirect(
      options.redirectTo ??
        "/sin-acceso"
    );
  }

  return access;
}

export async function requireAllPermissions(
  permissions: PermissionName[],
  options: AccessOptions = {}
): Promise<CurrentAccess> {
  const access = await requireAccess(
    options
  );

  const allowed = permissions.every(
    (permission) =>
      access.permissions.includes(
        permission
      )
  );

  if (!allowed) {
    redirect(
      options.redirectTo ??
        "/sin-acceso"
    );
  }

  return access;
}

export function canAccessMinistry(
  access: CurrentAccess,
  ministryName: string
) {
  if (
    access.permissions.includes(
      "teams.view_all"
    )
  ) {
    return true;
  }

  if (
    !access.permissions.includes(
      "teams.view_scoped"
    )
  ) {
    return false;
  }

  const normalizedMinistry =
    ministryName
      .trim()
      .toLocaleLowerCase("es-MX");

  return access.ministryScope.some(
    (scope) =>
      scope
        .trim()
        .toLocaleLowerCase("es-MX") ===
      normalizedMinistry
  );
}

export function filterByMinistryScope<
  T extends {
    team_name: string;
  },
>(
  rows: T[],
  access: CurrentAccess
) {
  if (
    access.permissions.includes(
      "teams.view_all"
    )
  ) {
    return rows;
  }

  return rows.filter((row) =>
    canAccessMinistry(
      access,
      row.team_name
    )
  );
}

export function getDefaultRoute(
  access: CurrentAccess
) {
  switch (access.roleName) {
    case "admin":
      return "/admin";

    case "coordinator":
      return "/coordinacion";

    case "pastor":
      return "/pastor";

    case "ministry_leader":
      return "/mi-ministerio";

    case "team_leader":
      /*
       * Conservamos temporalmente este rol por compatibilidad,
       * aunque por ahora no lo utilizaremos en Comunidad VID.
       */
      return "/mi-ministerio";

    case "server":
      return "/mi-servicio";

    case "new_volunteer":
      return "/perfil";

    default:
      return "/perfil";
  }
}