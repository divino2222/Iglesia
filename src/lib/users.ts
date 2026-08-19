import "server-only";

import type { RoleName } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = {
  id: string;
  name: RoleName;
  label: string;
  description: string | null;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  legacyRole: string | null;
  ministries: string[];
  isActive: boolean;
  authUserId: string | null;
  roleId: string | null;
  ministryScope: string[];
  createdAt: string;
  updatedAt: string | null;
  role: UserRole | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: string | null;
  ministries: string[] | null;
  is_active: boolean;
  auth_user_id: string | null;
  role_id: string | null;
  ministry_scope: string[] | null;
  created_at: string;
  updated_at?: string | null;
  roles:
    | {
        id: string;
        name: string;
        label: string;
        description: string | null;
      }
    | {
        id: string;
        name: string;
        label: string;
        description: string | null;
      }[]
    | null;
};

type RoleRow = {
  id: string;
  name: string;
  label: string;
  description: string | null;
};

type GetUsersOptions = {
  search?: string;
  roleName?: RoleName | "all";
  ministry?: string | "all";
  status?: "active" | "inactive" | "all";
};

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

function normalizeStringArray(
  value: string[] | null | undefined
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function mapRole(
  value: ProfileRow["roles"]
): UserRole | null {
  const role = getSingleRelation(value);

  if (!role || !isRoleName(role.name)) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    label: role.label,
    description: role.description,
  };
}

function mapProfile(
  profile: ProfileRow
): UserProfile {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    photoUrl: profile.photo_url,
    legacyRole: profile.role,
    ministries: normalizeStringArray(
      profile.ministries
    ),
    isActive: profile.is_active,
    authUserId: profile.auth_user_id,
    roleId: profile.role_id,
    ministryScope: normalizeStringArray(
      profile.ministry_scope
    ),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at ?? null,
    role: mapRole(profile.roles),
  };
}

function normalizeSearch(value?: string) {
  return value
    ?.trim()
    .toLocaleLowerCase("es-MX");
}

export async function getAllUsers(
  options: GetUsersOptions = {}
): Promise<UserProfile[]> {
  const admin = createAdminClient();

  const {
    search,
    roleName = "all",
    ministry = "all",
    status = "all",
  } = options;

  let query = admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      role,
      ministries,
      is_active,
      auth_user_id,
      role_id,
      ministry_scope,
      created_at,
      updated_at,
      roles (
        id,
        name,
        label,
        description
      )
    `)
    .order("full_name", {
      ascending: true,
    });

  if (status === "active") {
    query = query.eq("is_active", true);
  }

  if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (
    roleName !== "all"
  ) {
    const {
      data: role,
      error: roleError,
    } = await admin
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .maybeSingle();

    if (roleError) {
      throw new Error(
        `No se pudo consultar el rol: ${roleError.message}`
      );
    }

    if (!role) {
      return [];
    }

    query = query.eq("role_id", role.id);
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw new Error(
      `No se pudieron consultar los usuarios: ${error.message}`
    );
  }

  let users = (
    (data ?? []) as ProfileRow[]
  ).map(mapProfile);

  const normalizedSearch =
    normalizeSearch(search);

  if (normalizedSearch) {
    users = users.filter((user) => {
      const searchableValues = [
        user.fullName,
        user.email ?? "",
        user.phone ?? "",
        user.role?.label ?? "",
        user.role?.name ?? "",
        ...user.ministries,
        ...user.ministryScope,
      ]
        .join(" ")
        .toLocaleLowerCase("es-MX");

      return searchableValues.includes(
        normalizedSearch
      );
    });
  }

  if (ministry !== "all") {
    const normalizedMinistry =
      ministry
        .trim()
        .toLocaleLowerCase("es-MX");

    users = users.filter((user) => {
      const scopes = [
        ...user.ministries,
        ...user.ministryScope,
      ].map((item) =>
        item
          .trim()
          .toLocaleLowerCase("es-MX")
      );

      return scopes.includes(
        normalizedMinistry
      );
    });
  }

  return users;
}

export async function getUserById(
  profileId: string
): Promise<UserProfile | null> {
  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      role,
      ministries,
      is_active,
      auth_user_id,
      role_id,
      ministry_scope,
      created_at,
      updated_at,
      roles (
        id,
        name,
        label,
        description
      )
    `)
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo consultar el usuario: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data as ProfileRow
  );
}

export async function getUserByEmail(
  email: string
): Promise<UserProfile | null> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      role,
      ministries,
      is_active,
      auth_user_id,
      role_id,
      ministry_scope,
      created_at,
      updated_at,
      roles (
        id,
        name,
        label,
        description
      )
    `)
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo consultar el usuario: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data as ProfileRow
  );
}

export async function getRoles(): Promise<
  UserRole[]
> {
  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("roles")
    .select(`
      id,
      name,
      label,
      description
    `)
    .order("label", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `No se pudieron consultar los roles: ${error.message}`
    );
  }

  return (
    (data ?? []) as RoleRow[]
  )
    .filter((role) =>
      isRoleName(role.name)
    )
    .map((role) => ({
      id: role.id,
      name: role.name as RoleName,
      label: role.label,
      description: role.description,
    }));
}

export async function getMinistries(): Promise<
  string[]
> {
  const admin = createAdminClient();

  const {
    data: ministryRows,
    error: ministriesError,
  } = await admin
    .from("ministries")
    .select("name")
    .order("name", {
      ascending: true,
    });

  if (!ministriesError) {
    const names = (
      ministryRows ?? []
    )
      .map((row) =>
        typeof row.name === "string"
          ? row.name.trim()
          : ""
      )
      .filter(Boolean);

    if (names.length > 0) {
      return Array.from(
        new Set(names)
      );
    }
  }

  /*
   * Respaldo temporal:
   * si la tabla ministries no tiene registros o
   * usa otra estructura, obtenemos los nombres
   * desde profiles y service_teams.
   */
  const [
    profilesResult,
    teamsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "ministries, ministry_scope"
      ),

    admin
      .from("service_teams")
      .select("team_name"),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `No se pudieron consultar los ministerios de los perfiles: ${profilesResult.error.message}`
    );
  }

  if (teamsResult.error) {
    throw new Error(
      `No se pudieron consultar los equipos: ${teamsResult.error.message}`
    );
  }

  const profileNames = (
    profilesResult.data ?? []
  ).flatMap((profile) => [
    ...normalizeStringArray(
      profile.ministries
    ),
    ...normalizeStringArray(
      profile.ministry_scope
    ),
  ]);

  const teamNames = (
    teamsResult.data ?? []
  )
    .map((team) =>
      typeof team.team_name === "string"
        ? team.team_name.trim()
        : ""
    )
    .filter(Boolean);

  return Array.from(
    new Set([
      ...profileNames,
      ...teamNames,
    ])
  ).sort((first, second) =>
    first.localeCompare(
      second,
      "es-MX"
    )
  );
}

export async function getUsersByRole(
  roleName: RoleName
) {
  return getAllUsers({
    roleName,
  });
}

export async function getUsersByMinistry(
  ministry: string
) {
  return getAllUsers({
    ministry,
  });
}

export async function searchUsers(
  search: string
) {
  return getAllUsers({
    search,
  });
}

export async function getActiveUsers() {
  return getAllUsers({
    status: "active",
  });
}

export async function getInactiveUsers() {
  return getAllUsers({
    status: "inactive",
  });
}

export async function getUserStats() {
  const users = await getAllUsers();

  const byRole = users.reduce<
    Record<string, number>
  >((result, user) => {
    const roleName =
      user.role?.name ??
      "without_role";

    result[roleName] =
      (result[roleName] ?? 0) + 1;

    return result;
  }, {});

  const ministries = new Set(
    users.flatMap((user) => [
      ...user.ministries,
      ...user.ministryScope,
    ])
  );

  return {
    total: users.length,
    active: users.filter(
      (user) => user.isActive
    ).length,
    inactive: users.filter(
      (user) => !user.isActive
    ).length,
    linkedAccounts: users.filter(
      (user) =>
        Boolean(user.authUserId)
    ).length,
    withoutAccount: users.filter(
      (user) =>
        !user.authUserId
    ).length,
    withoutRole: users.filter(
      (user) => !user.role
    ).length,
    ministries: ministries.size,
    byRole,
  };
}