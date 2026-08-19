import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionRow = {
  id: string;
  profile_id: string | null;
  recipient: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayloadInput = {
  title: string;
  body: string;
  url: string;
  type?: string;
  servicePlanId?: string | null;
  assignmentId?: string | null;
  requireInteraction?: boolean;
};

type PushResult = {
  sent: number;
  failed: number;
  inactive: number;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) {
    return;
  }

  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env.VAPID_PRIVATE_KEY;

  const subject =
    process.env.VAPID_SUBJECT;

  if (!publicKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY."
    );
  }

  if (!privateKey) {
    throw new Error(
      "Falta VAPID_PRIVATE_KEY."
    );
  }

  if (!subject) {
    throw new Error(
      "Falta VAPID_SUBJECT."
    );
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );

  vapidConfigured = true;
}

function getStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error
  ) {
    const statusCode = Number(
      (error as { statusCode?: unknown }).statusCode
    );

    return Number.isFinite(statusCode)
      ? statusCode
      : null;
  }

  return null;
}

function buildPayload({
  title,
  body,
  url,
  type = "notification",
  servicePlanId = null,
  assignmentId = null,
  requireInteraction = false,
}: PushPayloadInput) {
  return JSON.stringify({
    title,
    body,
    url,
    type,
    servicePlanId,
    assignmentId,
    requireInteraction,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: assignmentId
      ? `${type}-${assignmentId}`
      : servicePlanId
        ? `${type}-${servicePlanId}`
        : `${type}-${Date.now()}`,
  });
}

async function disableSubscription(
  subscriptionId: string
) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    console.error(
      "No se pudo desactivar la suscripción Push:",
      error.message
    );
  }
}

async function sendToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payloadInput: PushPayloadInput
): Promise<PushResult> {
  configureVapid();

  if (subscriptions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      inactive: 0,
    };
  }

  const payload = buildPayload(payloadInput);

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
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

        return {
          sent: 1,
          failed: 0,
          inactive: 0,
        };
      } catch (error) {
        const statusCode =
          getStatusCode(error);

        /*
         * Los códigos 404 y 410 normalmente indican que
         * el navegador eliminó o expiró la suscripción.
         */
        if (
          statusCode === 404 ||
          statusCode === 410
        ) {
          await disableSubscription(
            subscription.id
          );

          return {
            sent: 0,
            failed: 0,
            inactive: 1,
          };
        }

        console.error(
          "No se pudo enviar una notificación Push:",
          error
        );

        return {
          sent: 0,
          failed: 1,
          inactive: 0,
        };
      }
    })
  );

  return results.reduce<PushResult>(
    (totals, result) => ({
      sent: totals.sent + result.sent,
      failed:
        totals.failed + result.failed,
      inactive:
        totals.inactive + result.inactive,
    }),
    {
      sent: 0,
      failed: 0,
      inactive: 0,
    }
  );
}

export async function sendAdminPushNotification(
  payload: PushPayloadInput
): Promise<PushResult> {
  const admin = createAdminClient();

  const {
    data: subscriptions,
    error,
  } = await admin
    .from("push_subscriptions")
    .select(`
      id,
      profile_id,
      recipient,
      endpoint,
      p256dh,
      auth
    `)
    .eq("recipient", "admin")
    .eq("is_active", true);

  if (error) {
    console.error(
      "No se pudieron consultar las suscripciones del administrador:",
      error.message
    );

    return {
      sent: 0,
      failed: 1,
      inactive: 0,
    };
  }

  return sendToSubscriptions(
    (subscriptions ?? []) as PushSubscriptionRow[],
    payload
  );
}

export async function sendProfilePushNotification(
  profileId: string,
  payload: PushPayloadInput
): Promise<PushResult> {
  if (!profileId) {
    return {
      sent: 0,
      failed: 1,
      inactive: 0,
    };
  }

  const admin = createAdminClient();

  const {
    data: subscriptions,
    error,
  } = await admin
    .from("push_subscriptions")
    .select(`
      id,
      profile_id,
      recipient,
      endpoint,
      p256dh,
      auth
    `)
    .eq("profile_id", profileId)
    .eq("recipient", "server")
    .eq("is_active", true);

  if (error) {
    console.error(
      `No se pudieron consultar las suscripciones del perfil ${profileId}:`,
      error.message
    );

    return {
      sent: 0,
      failed: 1,
      inactive: 0,
    };
  }

  return sendToSubscriptions(
    (subscriptions ?? []) as PushSubscriptionRow[],
    payload
  );
}

export async function sendProfilesPushNotification(
  profileIds: string[],
  payload: PushPayloadInput
): Promise<PushResult> {
  const uniqueProfileIds = Array.from(
    new Set(
      profileIds
        .map((profileId) =>
          profileId.trim()
        )
        .filter(Boolean)
    )
  );

  if (uniqueProfileIds.length === 0) {
    return {
      sent: 0,
      failed: 0,
      inactive: 0,
    };
  }

  const admin = createAdminClient();

  const {
    data: subscriptions,
    error,
  } = await admin
    .from("push_subscriptions")
    .select(`
      id,
      profile_id,
      recipient,
      endpoint,
      p256dh,
      auth
    `)
    .in("profile_id", uniqueProfileIds)
    .eq("recipient", "server")
    .eq("is_active", true);

  if (error) {
    console.error(
      "No se pudieron consultar las suscripciones de los perfiles:",
      error.message
    );

    return {
      sent: 0,
      failed: 1,
      inactive: 0,
    };
  }

  return sendToSubscriptions(
    (subscriptions ?? []) as PushSubscriptionRow[],
    payload
  );
}