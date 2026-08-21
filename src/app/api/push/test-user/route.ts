import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  email?: string;
  pin?: string;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  is_active: boolean;
};

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Faltan VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const email = body.email?.trim().toLowerCase();
    const pin = body.pin?.trim();

    /*
     * =====================================================
     * 1. PROTEGER ESTA RUTA DE PRUEBA
     * =====================================================
     */

    if (!process.env.SERVING_ADMIN_PIN) {
      return NextResponse.json(
        {
          ok: false,
          error: "SERVING_ADMIN_PIN no está configurado.",
        },
        { status: 500 }
      );
    }

    if (pin !== process.env.SERVING_ADMIN_PIN) {
      return NextResponse.json(
        {
          ok: false,
          error: "PIN incorrecto.",
        },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el correo del usuario.",
        },
        { status: 400 }
      );
    }

    configureWebPush();

    const supabase = createAdminClient();

    /*
     * =====================================================
     * 2. BUSCAR EL SERVIDOR
     * =====================================================
     */

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id,full_name,email,auth_user_id")
      .ilike("email", email)
      .maybeSingle();

    if (serverError) {
      return NextResponse.json(
        {
          ok: false,
          error: serverError.message,
        },
        { status: 500 }
      );
    }

    if (!server) {
      return NextResponse.json(
        {
          ok: false,
          error: `No encontré un servidor con el correo ${email}.`,
        },
        { status: 404 }
      );
    }

    if (!server.auth_user_id) {
      return NextResponse.json(
        {
          ok: false,
          error: `${server.full_name} todavía no tiene auth_user_id.`,
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * 3. BUSCAR SOLO LOS DISPOSITIVOS DE ESA PERSONA
     * =====================================================
     */

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,is_active")
      .eq("auth_user_id", server.auth_user_id)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];

    if (subscriptions.length === 0) {
      return NextResponse.json({
        ok: false,
        error: `${server.full_name} no tiene dispositivos Push activos.`,
      });
    }

    /*
     * =====================================================
     * 4. MENSAJE PERSONALIZADO
     * =====================================================
     */

    const payload = JSON.stringify({
      title: "Comunidad VID",
      body: `Hola ${server.full_name} 👋 Esta notificación fue enviada únicamente a tu dispositivo.`,
      url: "/mi-cuenta",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `personal-test-${server.auth_user_id}`,
    });

    let sent = 0;
    let failed = 0;

    /*
     * =====================================================
     * 5. ENVIAR SOLO A ESA PERSONA
     * =====================================================
     */

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );

        sent++;
      } catch (error) {
        failed++;

        const statusCode = (error as { statusCode?: number }).statusCode;

        console.error("PUSH TEST USER ERROR:", error);

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("endpoint", subscription.endpoint);
        }
      }
    }

    return NextResponse.json({
      ok: sent > 0,
      user: {
        fullName: server.full_name,
        email: server.email,
        authUserId: server.auth_user_id,
      },
      devices: subscriptions.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("TEST USER PUSH ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}