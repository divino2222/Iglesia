import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST() {
  try {
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
        { status: 401 }
      );
    }

    /*
     * IMPORTANTE:
     * Las variables se validan dentro del handler.
     * Así no tumbamos el build de Vercel.
     */
    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!subject || !publicKey || !privateKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La configuración VAPID no está completa en el servidor.",
        },
        { status: 503 }
      );
    }

    webpush.setVapidDetails(
      subject,
      publicKey,
      privateKey
    );

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          ok: false,
          error: "No se pudieron consultar tus dispositivos.",
        },
        { status: 500 }
      );
    }

    const subscriptions =
      (data ?? []) as StoredSubscription[];

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No encontramos ningún dispositivo vinculado a esta cuenta.",
        },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: "Comunidad VID",
      body: "¡Las notificaciones funcionan! 🙌",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      url: "/",
      tag: "push-test",
    });

    let sent = 0;
    let removed = 0;
    let failed = 0;

    for (const item of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: item.endpoint,

            keys: {
              p256dh: item.p256dh,
              auth: item.auth,
            },
          },
          payload
        );

        sent++;
      } catch (error: any) {
        const statusCode = error?.statusCode;

        /*
         * 404 / 410 significa normalmente que esa
         * suscripción ya dejó de existir.
         */
        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", item.id);

          removed++;
          continue;
        }

        console.error(
          "Error enviando push:",
          error
        );

        failed++;
      }
    }

    return NextResponse.json({
      ok: sent > 0,
      sent,
      removed,
      failed,
    });
  } catch (error) {
    console.error("POST /api/push/test:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          "No fue posible enviar la notificación de prueba.",
      },
      { status: 500 }
    );
  }
}