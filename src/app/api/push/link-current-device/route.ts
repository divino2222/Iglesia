import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  endpoint?: string;
};

export async function POST(request: Request) {
  try {
    /*
     * 1. Identificamos al usuario que tiene
     *    iniciada la sesión.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes iniciar sesión para vincular este dispositivo.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. Recibimos endpoint de la suscripción
     *    Push ya existente.
     */
    const body = (await request.json()) as RequestBody;

    const endpoint = body.endpoint?.trim();

    if (!endpoint) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se recibió el endpoint Push.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 3. Service Role:
     *    vinculamos esa suscripción con auth.users.
     */
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("push_subscriptions")
      .update({
        auth_user_id: user.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("endpoint", endpoint)
      .select("endpoint,auth_user_id")
      .maybeSingle();

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

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La suscripción Push todavía no existe. Activa primero las notificaciones.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      linked: true,
    });
  } catch (error) {
    console.error("LINK PUSH DEVICE ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}