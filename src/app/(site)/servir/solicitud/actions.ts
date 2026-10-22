"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type CreateMinistryRequestInput = {
  ministrySlug: string;
  message: string;
};

const ministryNames: Record<string, string> = {
  alabanza: "Alabanza",
  cafeteria: "Cafetería",
  multimedia: "Multimedia",
  ninos: "Niños",
  ofrendas: "Ofrendas",
  ujieres: "Ujieres",
};

export async function createMinistryRequestAction(
  input: CreateMinistryRequestInput
) {
  const supabase = await createClient();

  /* =====================================================
     USUARIO
  ===================================================== */

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error:
        "Debes iniciar sesión para enviar tu solicitud.",
    };
  }

  /* =====================================================
     VALIDAR MINISTERIO
  ===================================================== */

  const ministrySlug =
    input.ministrySlug
      .trim()
      .toLowerCase();

  const ministryName =
    ministryNames[ministrySlug];

  if (!ministryName) {
    return {
      success: false,
      error:
        "El ministerio seleccionado no es válido.",
    };
  }

  /* =====================================================
     VALIDAR MENSAJE
  ===================================================== */

  const cleanMessage =
    input.message.trim();

  if (cleanMessage.length < 10) {
    return {
      success: false,
      error:
        "Cuéntanos un poco más. Escribe al menos 10 caracteres.",
    };
  }

  /* =====================================================
     BUSCAR MINISTERIO
  ===================================================== */

  const {
    data: ministry,
    error: ministryError,
  } = await supabase
    .from("ministries")
    .select(`
      id,
      name
    `)
    .eq(
      "name",
      ministryName
    )
    .eq(
      "is_active",
      true
    )
    .maybeSingle();

  if (
    ministryError ||
    !ministry
  ) {
    return {
      success: false,
      error:
        "No fue posible encontrar el ministerio seleccionado.",
    };
  }

  /* =====================================================
     COMPROBAR SOLICITUD ACTIVA

     IMPORTANTE:
     rejected NO bloquea una solicitud nueva.

     Solo bloqueamos:
     - pending
     - approved
  ===================================================== */

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("ministry_requests")
    .select(`
      id,
      status
    `)
    .eq(
      "auth_user_id",
      user.id
    )
    .eq(
      "ministry_id",
      ministry.id
    )
    .in("status", [
      "pending",
      "approved",
    ])
    .maybeSingle();

  if (existingError) {
    return {
      success: false,
      error:
        "No fue posible verificar tus solicitudes actuales.",
    };
  }

  if (existing) {
    if (
      existing.status ===
      "approved"
    ) {
      return {
        success: false,
        error:
          "Ya formas parte de este ministerio.",
      };
    }

    return {
      success: false,
      error:
        "Ya tienes una solicitud pendiente para este ministerio.",
    };
  }

  /* =====================================================
     CREAR SOLICITUD
  ===================================================== */

  const {
    error: insertError,
  } = await supabase
    .from("ministry_requests")
    .insert({
      auth_user_id:
        user.id,

      ministry_id:
        ministry.id,

      status:
        "pending",

      message:
        cleanMessage,
    });

  if (insertError) {
    console.error(
      "createMinistryRequestAction:",
      insertError
    );

    return {
      success: false,
      error:
        "No fue posible enviar tu solicitud.",
    };
  }

  /* =====================================================
     REVALIDAR
  ===================================================== */

  revalidatePath("/servir");

  revalidatePath(
    "/servir/solicitud"
  );

  revalidatePath(
    `/servir/${ministrySlug}`
  );

  revalidatePath(
    "/mi-cuenta"
  );

  /* =====================================================
     REDIRECT
  ===================================================== */

  redirect(
    `/servir/solicitud?ministerio=${encodeURIComponent(
      ministrySlug
    )}&enviada=1`
  );
}