import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   TIPOS
========================================================= */

type PushSubscriptionBody = {
  endpoint?: string;

  expirationTime?:
    | number
    | null;

  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       1. USUARIO AUTENTICADO
    ====================================================== */

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar sesión para activar las notificaciones de tu servicio.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. LEER SUSCRIPCIÓN
    ====================================================== */

    const body =
      (await request.json()) as PushSubscriptionBody;

    const endpoint =
      body.endpoint?.trim();

    const p256dh =
      body.keys?.p256dh?.trim();

    const auth =
      body.keys?.auth?.trim();

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          error:
            "La suscripción push está incompleta.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. GUARDAR CON SERVICE ROLE

       Usamos endpoint como identificador único
       del navegador/dispositivo.
    ====================================================== */

    const admin =
      createAdminClient();

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const {
      error: saveError,
    } = await admin
      .from(
        "push_subscriptions"
      )
      .upsert(
        {
          auth_user_id:
            user.id,

          endpoint,

          p256dh,

          auth,

          user_agent:
            userAgent,

          is_active: true,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "endpoint",
        }
      );

    if (saveError) {
      console.error(
        "Error guardando push:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo registrar el dispositivo.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       4. RESPUESTA
    ====================================================== */

    return NextResponse.json({
      ok: true,
      message:
        "Notificaciones activadas.",
    });
  } catch (error) {
    console.error(
      "Error en /api/push/subscribe:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al activar las notificaciones.",
      },
      {
        status: 500,
      }
    );
  }
}