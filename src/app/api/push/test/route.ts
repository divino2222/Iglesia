import { NextResponse } from "next/server";
import webpush from "web-push";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  is_active: boolean;
};

type WebPushError = {
  statusCode?: number;
  body?: string;
  message?: string;
  headers?: Record<string, string>;
};

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey =
    process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return {
      ok: false as const,
      error: "Faltan variables VAPID.",
    };
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );

  return {
    ok: true as const,
  };
}

export async function POST() {
  try {
    /* =====================================================
       1. USUARIO
    ====================================================== */

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes iniciar sesión.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. VAPID
    ====================================================== */

    const vapid = configureWebPush();

    if (!vapid.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: vapid.error,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       3. SUSCRIPCIONES
    ====================================================== */

    const admin = createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("push_subscriptions")
      .select(
        `
        endpoint,
        p256dh,
        auth,
        is_active
        `
      )
      .eq(
        "auth_user_id",
        user.id
      )
      .eq(
        "is_active",
        true
      );

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const subscriptions =
      (data ?? []) as PushSubscriptionRow[];

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay dispositivos registrados para este usuario.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       4. PAYLOAD
    ====================================================== */

    const payload = JSON.stringify({
      title: "Comunidad VID",

      body:
        "Las notificaciones ya están funcionando 🙌",

      url: "/mi-cuenta",

      icon:
  "/icons/icon-192.png",

badge:
  "/icons/icon-192.png",

      tag:
        "comunidad-vid-test",

      requireInteraction: false,
    });

    /* =====================================================
       5. ENVÍO + DIAGNÓSTICO
    ====================================================== */

    let sent = 0;
    let failed = 0;

    const errors: Array<{
      statusCode: number | null;
      message: string;
      body: string | null;
    }> = [];

    for (const sub of subscriptions) {
      try {
        const response =
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,

              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },

            payload
          );

        console.log(
          "PUSH ENVIADO:",
          response.statusCode
        );

        sent++;
      } catch (error) {
        failed++;

        const pushError =
          error as WebPushError;

        console.error(
          "WEB PUSH ERROR:",
          {
            statusCode:
              pushError.statusCode,

            message:
              pushError.message,

            body:
              pushError.body,
          }
        );

        errors.push({
          statusCode:
            pushError.statusCode ??
            null,

          message:
            pushError.message ??
            "Error desconocido",

          body:
            pushError.body ??
            null,
        });

        /*
         * IMPORTANTE:
         *
         * Durante el diagnóstico NO desactivamos
         * automáticamente la suscripción.
         *
         * Primero queremos conocer el error real.
         */
      }
    }

    /* =====================================================
       6. RESULTADO
    ====================================================== */

    return NextResponse.json({
      ok: sent > 0,

      sent,

      failed,

      subscriptions:
        subscriptions.length,

      errors,

      message:
        sent > 0
          ? "Notificación enviada."
          : "No se pudo enviar ninguna notificación.",
    });
  } catch (error) {
    console.error(
      "PUSH TEST ERROR GENERAL:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}