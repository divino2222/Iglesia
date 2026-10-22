import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import LoginForm from "@/components/auth/login-form";
import {
  getCurrentAccess,
  getDefaultRoute,
} from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

/*
 * Devuelve null si no hay un destino interno válido;
 * en ese caso se usa la ruta inicial según el rol.
 */
function getSafeNextPath(
  next?: string | null
) {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//")
  ) {
    return null;
  }

  return next;
}

export default async function LoginPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const nextPath =
    getSafeNextPath(
      params?.next
    );

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  /*
   * Si la persona ya inició sesión,
   * respetamos el destino que traía.
   *
   * Ejemplo:
   * /login?next=/servir/solicitud?ministerio=alabanza
   *
   * irá directamente a esa solicitud.
   *
   * Sin destino, va a la ruta inicial de su rol.
   */
  if (user) {
    if (nextPath) {
      redirect(
        nextPath
      );
    }

    const access =
      await getCurrentAccess();

    redirect(
      access
        ? getDefaultRoute(access)
        : "/mi-cuenta"
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          {/* CABECERA */}

          <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <LockKeyhole
                size={13}
              />

              Mi Comunidad
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Inicia sesión para continuar dentro de Comunidad VID.
            </p>

            {nextPath?.startsWith(
              "/servir/solicitud"
            ) ? (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4">
                <p className="text-sm font-semibold">
                  Continuaremos con tu solicitud para servir
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Después de iniciar sesión regresarás automáticamente al proceso que estabas realizando.
                </p>
              </div>
            ) : null}
          </div>

          {/* FORMULARIO */}

          <div className="p-5">
            <LoginForm
              next={
                nextPath
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}