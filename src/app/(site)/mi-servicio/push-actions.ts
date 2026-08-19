"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionInput = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    throw new Error("No hay una sesión activa.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", user.email)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo consultar el perfil: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "No se encontró un perfil relacionado con esta cuenta."
    );
  }

  return {
    admin,
    profile,
  };
}

export async function saveServerPushSubscription(
  subscription: PushSubscriptionInput,
  userAgent: string
) {
  const { admin, profile } =
    await getAuthenticatedProfile();

  if (!subscription.endpoint) {
    throw new Error(
      "La suscripción no contiene un endpoint válido."
    );
  }

  if (
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    throw new Error(
      "La suscripción no contiene las claves necesarias."
    );
  }

  const { error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        profile_id: profile.id,
        recipient: "server",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      }
    );

  if (error) {
    throw new Error(
      `No se pudo guardar la suscripción: ${error.message}`
    );
  }

  return {
    success: true,
    profileName: profile.full_name,
  };
}

export async function disableServerPushSubscription(
  endpoint: string
) {
  const { admin, profile } =
    await getAuthenticatedProfile();

  if (!endpoint) {
    throw new Error(
      "No se encontró el endpoint de la suscripción."
    );
  }

  const { error } = await admin
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("endpoint", endpoint)
    .eq("profile_id", profile.id);

  if (error) {
    throw new Error(
      `No se pudo desactivar la suscripción: ${error.message}`
    );
  }

  return {
    success: true,
  };
}