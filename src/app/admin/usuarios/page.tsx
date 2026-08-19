import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import UserCard from "@/components/admin/user-card";

import {
  requirePermission,
} from "@/lib/auth/permissions";
import type {
  RoleName,
} from "@/lib/auth/permissions";

import {
  getAllUsers,
  getMinistries,
  getRoles,
  getUserStats,
} from "@/lib/users";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    ministry?: string;
    status?: string;
  }>;
};

type RoleFilter =
  | RoleName
  | "all";

function isRoleName(
  value: string
): value is RoleName {
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

function normalizeRoleFilter(
  value?: string
): RoleFilter {
  if (!value) {
    return "all";
  }

  if (value === "all") {
    return "all";
  }

  if (isRoleName(value)) {
    return value;
  }

  return "all";
}

function normalizeStatusFilter(
  value?: string
) {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "all"
  ) {
    return value;
  }

  return "all";
}

export default async function UsersAdminPage({
  searchParams,
}: PageProps) {
  const access =
    await requirePermission(
      "users.manage"
    );

  const params =
    await searchParams;

  const search =
    params?.q?.trim() ?? "";

  const roleName =
    normalizeRoleFilter(
      params?.role
    );

  const ministry =
    params?.ministry?.trim() ||
    "all";

  const status =
    normalizeStatusFilter(
      params?.status
    );

  const [
    users,
    roles,
    ministries,
    stats,
  ] = await Promise.all([
    getAllUsers({
      search,
      roleName,
      ministry,
      status,
    }),

    getRoles(),

    getMinistries(),

    getUserStats(),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft
            size={17}
          />
          Volver al Centro de Operaciones
        </Link>

        <section className="overflow-hidden rounded-[38px] bg-stone-950 text-white shadow-sm">
          <div className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              <UsersRound
                size={14}
              />
              Administración
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Usuarios y accesos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Administra roles,
              ministerios, cuentas
              vinculadas y estado de
              acceso de cada persona.
            </p>

            <div className="mt-5 rounded-[24px] bg-white/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Sesión actual
              </p>

              <p className="mt-1 text-sm font-semibold">
                {access.fullName}
              </p>

              <p className="mt-1 text-xs text-white/60">
                {access.roleLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            value={
              stats.total
            }
            label="Total"
            icon={
              <UsersRound
                size={18}
              />
            }
            className="border-stone-200 bg-white text-stone-800"
          />

          <StatCard
            value={
              stats.active
            }
            label="Activos"
            icon={
              <UserRoundCheck
                size={18}
              />
            }
            className="border-emerald-100 bg-emerald-50 text-emerald-700"
          />

          <StatCard
            value={
              stats.inactive
            }
            label="Inactivos"
            icon={
              <UserRoundX
                size={18}
              />
            }
            className="border-red-100 bg-red-50 text-red-700"
          />

          <StatCard
            value={
              stats.linkedAccounts
            }
            label="Con cuenta"
            icon={
              <BadgeCheck
                size={18}
              />
            }
            className="border-sky-100 bg-sky-50 text-sky-700"
          />

          <StatCard
            value={
              stats.withoutAccount
            }
            label="Sin cuenta"
            icon={
              <ShieldCheck
                size={18}
              />
            }
            className="border-amber-100 bg-amber-50 text-amber-700"
          />

          <StatCard
            value={
              stats.ministries
            }
            label="Ministerios"
            icon={
              <UsersRound
                size={18}
              />
            }
            className="border-violet-100 bg-violet-50 text-violet-700"
          />
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Buscar y filtrar
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Directorio de usuarios
            </h2>
          </div>

          <form
            method="get"
            className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          >
            <label className="relative block xl:col-span-2">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                type="search"
                name="q"
                defaultValue={
                  search
                }
                placeholder="Buscar por nombre, correo, teléfono o rol…"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition focus:border-stone-400"
              />
            </label>

            <select
              name="role"
              defaultValue={
                roleName
              }
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
            >
              <option value="all">
                Todos los roles
              </option>

              {roles.map(
                (role) => (
                  <option
                    key={
                      role.id
                    }
                    value={
                      role.name
                    }
                  >
                    {
                      role.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              name="ministry"
              defaultValue={
                ministry
              }
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
            >
              <option value="all">
                Todos los ministerios
              </option>

              {ministries.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <select
              name="status"
              defaultValue={
                status
              }
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
            >
              <option value="all">
                Todos los estados
              </option>

              <option value="active">
                Activos
              </option>

              <option value="inactive">
                Inactivos
              </option>
            </select>

            <button
              type="submit"
              className="flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 md:col-span-2 xl:col-span-5"
            >
              Aplicar filtros
            </button>
          </form>

          {search ||
          roleName !== "all" ||
          ministry !== "all" ||
          status !== "all" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                Filtros activos
              </p>

              {search ? (
                <FilterBadge>
                  Búsqueda:{" "}
                  {search}
                </FilterBadge>
              ) : null}

              {roleName !==
              "all" ? (
                <FilterBadge>
                  Rol:{" "}
                  {roles.find(
                    (role) =>
                      role.name ===
                      roleName
                  )?.label ??
                    roleName}
                </FilterBadge>
              ) : null}

              {ministry !==
              "all" ? (
                <FilterBadge>
                  Ministerio:{" "}
                  {ministry}
                </FilterBadge>
              ) : null}

              {status !==
              "all" ? (
                <FilterBadge>
                  Estado:{" "}
                  {status ===
                  "active"
                    ? "Activos"
                    : "Inactivos"}
                </FilterBadge>
              ) : null}

              <Link
                href="/admin/usuarios"
                className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Limpiar
              </Link>
            </div>
          ) : null}
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Personas
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Resultados
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                {users.length}{" "}
                {users.length ===
                1
                  ? "usuario encontrado"
                  : "usuarios encontrados"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <UsersRound
                size={20}
              />
            </div>
          </div>

          {users.length ===
          0 ? (
            <div className="mt-5 rounded-[26px] border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">
                No se encontraron
                usuarios
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Prueba con otros
                filtros o limpia la
                búsqueda actual.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {users.map(
                (user) => (
                  <UserCard
                    key={
                      user.id
                    }
                    user={
                      user
                    }
                    roles={
                      roles
                    }
                    ministries={
                      ministries
                    }
                    currentProfileId={
                      access.profileId
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  value,
  label,
  icon,
  className,
}: {
  value: number;
  label: string;
  icon: ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-[26px] border p-4 shadow-sm ${className}`}
    >
      <div>
        {icon}
      </div>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </p>
    </div>
  );
}

function FilterBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
      {children}
    </span>
  );
}