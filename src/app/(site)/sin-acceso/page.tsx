import Link from "next/link";
import {
  ArrowLeft,
  Home,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";

import {
  getCurrentAccess,
  getDefaultRoute,
} from "@/lib/auth/permissions";

export default async function SinAccesoPage() {
  const access = await getCurrentAccess();

  const defaultRoute = access
    ? getDefaultRoute(access)
    : "/login";

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-10">
      <div className="mx-auto max-w-md">
        <section className="overflow-hidden rounded-[38px] border border-stone-200 bg-white shadow-sm">
          <div className="bg-stone-950 p-7 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10">
              <ShieldAlert size={26} />
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Acceso restringido
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Esta sección no está disponible para tu cuenta
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Tu sesión está activa, pero el rol asignado no cuenta con
              los permisos necesarios para consultar esta página.
            </p>
          </div>

          <div className="space-y-5 p-6">
            {access ? (
              <div className="rounded-[26px] border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-200 text-stone-700">
                    <LockKeyhole size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                      Tu acceso actual
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-stone-950">
                      {access.fullName}
                    </p>

                    <p className="mt-1 text-sm text-stone-600">
                      {access.roleLabel}
                    </p>

                    {access.ministryScope.length > 0 ? (
                      <p className="mt-2 text-xs leading-5 text-stone-500">
                        Alcance:{" "}
                        {access.ministryScope.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  No encontramos una sesión activa.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Inicia sesión para consultar las secciones disponibles
                  para tu cuenta.
                </p>
              </div>
            )}

            <div className="rounded-[26px] border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-950">
                ¿Crees que deberías tener acceso?
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Solicita a coordinación que revise tu rol, tus permisos o
                los ministerios asignados a tu perfil.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={defaultRoute}
                className="flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                <Home size={17} />
                Ir a mi inicio
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                <ArrowLeft size={17} />
                Volver al sitio
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}