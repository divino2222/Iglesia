"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UserRoundX,
} from "lucide-react";

import {
  deactivateUser,
  reactivateUser,
  updateUserAccess,
} from "@/app/admin/usuarios/actions";

import type {
  UserProfile,
  UserRole,
} from "@/lib/users";

type UserCardProps = {
  user: UserProfile;
  roles: UserRole[];
  ministries: string[];
  currentProfileId: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleNeedsScope(
  roleName?: string | null
) {
  return (
    roleName === "ministry_leader" ||
    roleName === "team_leader"
  );
}

export default function UserCard({
  user,
  roles,
  ministries,
  currentProfileId,
}: UserCardProps) {
  const [isEditing, setIsEditing] =
    useState(false);

  const [
    selectedRole,
    setSelectedRole,
  ] = useState(
    user.role?.name ?? "server"
  );

  const currentScope = useMemo(
    () =>
      new Set(
        user.ministryScope
      ),
    [user.ministryScope]
  );

  const isCurrentUser =
    user.id === currentProfileId;

  const needsScope =
    roleNeedsScope(
      selectedRole
    );

  /*
   * Las Server Actions originales devuelven
   * información útil para otros flujos.
   *
   * Sin embargo, React exige que una función
   * utilizada directamente en <form action={...}>
   * devuelva void o Promise<void>.
   *
   * Estos wrappers ejecutan las acciones y
   * descartan deliberadamente su valor de retorno.
   */
  async function handleUpdateUserAccess(
    formData: FormData
  ): Promise<void> {
    await updateUserAccess(
      formData
    );
  }

  async function handleDeactivateUser(
    formData: FormData
  ): Promise<void> {
    await deactivateUser(
      formData
    );
  }

  async function handleReactivateUser(
    formData: FormData
  ): Promise<void> {
    await reactivateUser(
      formData
    );
  }

  const visibleMinistries = [
    ...new Set([
      ...user.ministries,
      ...user.ministryScope,
    ]),
  ];

  return (
    <article className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-stone-950 bg-cover bg-center text-sm font-bold text-white"
            style={
              user.photoUrl
                ? {
                    backgroundImage: `url(${user.photoUrl})`,
                  }
                : undefined
            }
          >
            {!user.photoUrl
              ? getInitials(
                  user.fullName
                )
              : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-stone-950">
                  {user.fullName}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    <ShieldCheck
                      size={14}
                    />

                    {user.role?.label ||
                      "Sin rol asignado"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {user.isActive ? (
                      <CheckCircle2
                        size={14}
                      />
                    ) : (
                      <UserRoundX
                        size={14}
                      />
                    )}

                    {user.isActive
                      ? "Activo"
                      : "Inactivo"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      user.authUserId
                        ? "bg-sky-50 text-sky-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <BadgeCheck
                      size={14}
                    />

                    {user.authUserId
                      ? "Cuenta vinculada"
                      : "Sin cuenta"}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/personas/${user.id}`}
                  className="inline-flex items-center rounded-2xl bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
                >
                  Ver perfil
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setIsEditing(
                      (current) =>
                        !current
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Editar acceso

                  <ChevronDown
                    size={15}
                    className={`transition ${
                      isEditing
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <Mail
                  size={15}
                  className="shrink-0 text-stone-400"
                />

                <span className="truncate">
                  {user.email ||
                    "Sin correo registrado"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone
                  size={15}
                  className="shrink-0 text-stone-400"
                />

                <span>
                  {user.phone ||
                    "Sin teléfono registrado"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Ministerios
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {visibleMinistries.length >
                0 ? (
                  visibleMinistries.map(
                    (ministry) => (
                      <span
                        key={
                          ministry
                        }
                        className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700"
                      >
                        {
                          ministry
                        }
                      </span>
                    )
                  )
                ) : (
                  <span className="text-sm text-stone-500">
                    Sin ministerios
                    asignados
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="border-t border-stone-200 bg-stone-50 p-5">
          <form
            action={
              handleUpdateUserAccess
            }
            className="space-y-5"
          >
            <input
              type="hidden"
              name="profile_id"
              value={user.id}
            />

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Rol
              </span>

              <select
                name="role_name"
                value={selectedRole}
                onChange={(event) =>
  setSelectedRole(
    event.target.value as UserRole["name"]
  )
}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-400"
              >
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
            </label>

            {needsScope ? (
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Ministerios
                  autorizados
                </legend>

                {ministries.length >
                0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ministries.map(
                      (
                        ministry
                      ) => (
                        <label
                          key={
                            ministry
                          }
                          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                        >
                          <input
                            type="checkbox"
                            name="ministry_scope"
                            value={
                              ministry
                            }
                            defaultChecked={currentScope.has(
                              ministry
                            )}
                            className="h-4 w-4 rounded border-stone-300"
                          />

                          <span>
                            {
                              ministry
                            }
                          </span>
                        </label>
                      )
                    )}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No hay
                    ministerios
                    disponibles.
                  </p>
                )}
              </fieldset>
            ) : null}

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-stone-950">
                  Perfil activo
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  Controla si la
                  persona puede seguir
                  usando el sistema.
                </p>
              </div>

              <select
                name="is_active"
                defaultValue={
                  user.isActive
                    ? "true"
                    : "false"
                }
                disabled={
                  isCurrentUser
                }
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="true">
                  Activo
                </option>

                <option value="false">
                  Inactivo
                </option>
              </select>
            </label>

            {isCurrentUser ? (
              <p className="rounded-2xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
                No puedes desactivar
                tu propio perfil ni
                retirarte el rol de
                administrador desde
                esta pantalla.
              </p>
            ) : null}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <UserRound
                size={17}
              />
              Guardar acceso
            </button>
          </form>

          {!isCurrentUser ? (
            <div className="mt-4 border-t border-stone-200 pt-4">
              {user.isActive ? (
                <form
                  action={
                    handleDeactivateUser
                  }
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={
                      user.id
                    }
                  />

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                  >
                    <UserRoundX
                      size={
                        17
                      }
                    />
                    Desactivar
                    perfil
                  </button>
                </form>
              ) : (
                <form
                  action={
                    handleReactivateUser
                  }
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={
                      user.id
                    }
                  />

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                  >
                    <CheckCircle2
                      size={
                        17
                      }
                    />
                    Reactivar
                    perfil
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}