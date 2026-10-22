"use server";

import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionInput = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function saveAdminPushSubscription(
  subscription: PushSubscriptionInput,
  userAgent: string
) {
  await requirePermission("settings.manage");

  if (!subscription.endpoint) {
    throw new Error("La suscripción no contiene un endpoint válido.");
  }

  if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error(
      "La suscripción no contiene las claves necesarias."
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        recipient: "admin",
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

  return { success: true };
}

export async function disableAdminPushSubscription(
  endpoint: string
) {
  await requirePermission("settings.manage");

  if (!endpoint) {
    throw new Error(
      "No se encontró el endpoint de la suscripción."
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("endpoint", endpoint)
    .eq("recipient", "admin");

  if (error) {
    throw new Error(
      `No se pudo desactivar la suscripción: ${error.message}`
    );
  }

  return { success: true };
}
