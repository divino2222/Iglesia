"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAnyPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   PERMISOS
========================================================= */

async function requireCoordinationAccess() {
  await requireAnyPermission(
    [
      "dashboard.view",
      "services.view_all",
      "services.create",
      "teams.view_all",
      "teams.manage",
    ],
    {
      redirectTo: "/sin-acceso",
    }
  );
}

/* =========================================================
   REVALIDAR
========================================================= */

function revalidateMinistryRequestPaths(
  requestId: string
) {
  revalidatePath("/coordinacion");
  revalidatePath(
    "/coordinacion/servir/solicitudes"
  );
  revalidatePath(
    `/coordinacion/servir/solicitudes/${requestId}`
  );

  revalidatePath("/servir");
  revalidatePath("/mi-ministerio");
  revalidatePath("/mi-cuenta");
}

/* =========================================================
   APROBAR SOLICITUD
========================================================= */

export async function approveMinistryRequest(
  formData: FormData
) {
  await requireCoordinationAccess();

  const requestId = String(
    formData.get("request_id") || ""
  ).trim();

  const adminNotes =
    String(
      formData.get("admin_notes") || ""
    ).trim() || null;

  if (!requestId) {
    throw new Error(
      "No se recibió la solicitud."
    );
  }

  /* =======================================================
     USUARIO QUE ESTÁ REVISANDO
  ======================================================= */

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "No se pudo identificar al usuario que revisa la solicitud."
    );
  }

  const admin = createAdminClient();

  /* =======================================================
     1. OBTENER SOLICITUD
  ======================================================= */

  const {
    data: request,
    error: requestError,
  } = await admin
    .from("ministry_requests")
    .select(`
      id,
      auth_user_id,
      ministry_id,
      status,
      message
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(
      `No se pudo consultar la solicitud: ${requestError.message}`
    );
  }

  if (!request) {
    throw new Error(
      "La solicitud ya no existe."
    );
  }

  if (request.status !== "pending") {
    throw new Error(
      "Esta solicitud ya fue revisada."
    );
  }

  /* =======================================================
     2. OBTENER MINISTERIO
  ======================================================= */

  const {
    data: ministry,
    error: ministryError,
  } = await admin
    .from("ministries")
    .select(`
      id,
      name
    `)
    .eq("id", request.ministry_id)
    .maybeSingle();

  if (ministryError) {
    throw new Error(
      `No se pudo consultar el ministerio: ${ministryError.message}`
    );
  }

  if (!ministry) {
    throw new Error(
      "El ministerio de esta solicitud ya no existe."
    );
  }

  /* =======================================================
     3. OBTENER PERFIL
  ======================================================= */

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      auth_user_id,
      full_name,
      email,
      phone,
      photo_url,
      role,
      ministries,
      is_active
    `)
    .eq(
      "auth_user_id",
      request.auth_user_id
    )
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar el perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "La persona todavía no tiene un perfil vinculado."
    );
  }

  /* =======================================================
     4. AGREGAR MINISTERIO AL PERFIL
  ======================================================= */

  const currentProfileMinistries =
    Array.isArray(profile.ministries)
      ? profile.ministries
      : [];

  const updatedProfileMinistries = [
    ...new Set([
      ...currentProfileMinistries,
      ministry.name,
    ]),
  ];

  /*
   * Solo convertimos new_volunteer y member
   * a server. No tocamos pastor, coordinator,
   * ministry_leader, etc.
   */
  const nextRole =
    profile.role === "new_volunteer" ||
    profile.role === "member"
      ? "server"
      : profile.role;

  const {
    error: updateProfileError,
  } = await admin
    .from("profiles")
    .update({
      ministries:
        updatedProfileMinistries,

      role:
        nextRole,

      is_active: true,
    })
    .eq("id", profile.id);

  if (updateProfileError) {
    throw new Error(
      `No se pudo actualizar el perfil: ${updateProfileError.message}`
    );
  }

  /* =======================================================
     5. APROBAR SOLICITUD
  ======================================================= */

  const reviewedAt =
    new Date().toISOString();

  const {
    error: approvalError,
  } = await admin
    .from("ministry_requests")
    .update({
      status: "approved",

      admin_notes:
        adminNotes,

      reviewed_at:
        reviewedAt,

      reviewed_by:
        user.id,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (approvalError) {
    throw new Error(
      `No se pudo aprobar la solicitud: ${approvalError.message}`
    );
  }

  /* =======================================================
     6. ACTUALIZAR PANTALLAS
  ======================================================= */

  revalidateMinistryRequestPaths(
    requestId
  );

  redirect(
    "/coordinacion/servir/solicitudes"
  );
}

/* =========================================================
   NO APROBAR SOLICITUD
========================================================= */

export async function rejectMinistryRequest(
  formData: FormData
) {
  await requireCoordinationAccess();

  const requestId = String(
    formData.get("request_id") || ""
  ).trim();

  const adminNotes =
    String(
      formData.get("admin_notes") || ""
    ).trim() || null;

  if (!requestId) {
    throw new Error(
      "No se recibió la solicitud."
    );
  }

  /* =======================================================
     USUARIO QUE ESTÁ REVISANDO
  ======================================================= */

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "No se pudo identificar al usuario que revisa la solicitud."
    );
  }

  const admin = createAdminClient();

  /* =======================================================
     VERIFICAR SOLICITUD
  ======================================================= */

  const {
    data: request,
    error: requestError,
  } = await admin
    .from("ministry_requests")
    .select(`
      id,
      status
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(
      `No se pudo consultar la solicitud: ${requestError.message}`
    );
  }

  if (!request) {
    throw new Error(
      "La solicitud ya no existe."
    );
  }

  if (request.status !== "pending") {
    throw new Error(
      "Esta solicitud ya fue revisada."
    );
  }

  /* =======================================================
     MARCAR COMO NO APROBADA
  ======================================================= */

  const {
    error: rejectError,
  } = await admin
    .from("ministry_requests")
    .update({
      status: "rejected",

      admin_notes:
        adminNotes,

      reviewed_at:
        new Date().toISOString(),

      reviewed_by:
        user.id,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (rejectError) {
    throw new Error(
      `No se pudo actualizar la solicitud: ${rejectError.message}`
    );
  }

  revalidateMinistryRequestPaths(
    requestId
  );

  redirect(
    "/coordinacion/servir/solicitudes"
  );
}