import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as SubscriptionBody;

    const endpoint = body.endpoint?.trim();
    const p256dh = body.keys?.p256dh?.trim();
    const auth = body.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          ok: false,
          error: "La suscripción push está incompleta.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: request.headers.get("user-agent"),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error("Error guardando push subscription:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "No fue posible registrar este dispositivo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Dispositivo vinculado.",
    });
  } catch (error) {
    console.error("POST /api/push/subscribe:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No fue posible registrar las notificaciones.",
      },
      { status: 500 }
    );
  }
}