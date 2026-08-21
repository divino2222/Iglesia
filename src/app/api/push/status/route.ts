import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request
) {
  try {
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
          saved: false,
          error:
            "No hay sesión.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const endpoint =
      searchParams.get(
        "endpoint"
      );

    if (!endpoint) {
      return NextResponse.json(
        {
          saved: false,
          error:
            "Falta endpoint.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from(
        "push_subscriptions"
      )
      .select(
        "id,is_active"
      )
      .eq(
        "auth_user_id",
        user.id
      )
      .eq(
        "endpoint",
        endpoint
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          saved: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      saved:
        Boolean(
          data?.id &&
            data?.is_active
        ),
    });
  } catch {
    return NextResponse.json(
      {
        saved: false,
        error:
          "Error revisando la suscripción.",
      },
      {
        status: 500,
      }
    );
  }
}