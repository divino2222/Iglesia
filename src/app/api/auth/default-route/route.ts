import { NextResponse } from "next/server";

import {
  getCurrentAccess,
  getDefaultRoute,
} from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    /*
     * getCurrentAccess() valida la sesión mediante
     * supabase.auth.getUser() y después consulta
     * el perfil, rol y permisos actuales.
     */
    const access = await getCurrentAccess();

    if (!access) {
      return NextResponse.json(
        {
          error:
            "No se encontró una sesión activa o tu perfil todavía no tiene un rol válido.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const route = getDefaultRoute(access);

    return NextResponse.json(
      {
        route,
        role: access.roleName,
        roleLabel: access.roleLabel,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "No se pudo determinar la ruta inicial:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible determinar la ruta inicial.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}