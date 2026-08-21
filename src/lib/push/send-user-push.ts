import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

type SendUserPushInput = {
  authUserId: string;

  title: string;
  body: string;
  url: string;

  tag?: string;

  type: string;

  entityType?: string;
  entityId?: string;

  dedupeKey?: string;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureWebPush() {
  const subject =
    process.env.VAPID_SUBJECT;

  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env.VAPID_PRIVATE_KEY;

  if (
    !subject ||
    !publicKey ||
    !privateKey
  ) {
    throw new Error(
      "Faltan variables VAPID."
    );
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );
}

export async function sendUserPush(
  input: SendUserPushInput
) {
  configureWebPush();

  const supabase =
    createAdminClient();

  /*
   * =======================================================
   * 1. DEDUPE
   * =======================================================
   */

  if (input.dedupeKey) {
    const {
      data: existing,
    } = await supabase
      .from("user_notifications")
      .select("id")
      .eq(
        "dedupe_key",
        input.dedupeKey
      )
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        skipped: true,
        reason:
          "La notificación ya existe.",
        sent: 0,
        failed: 0,
      };
    }
  }

  /*
   * =======================================================
   * 2. GUARDAR NOTIFICACIÓN INTERNA
   * =======================================================
   */

  const {
    error: notificationError,
  } = await supabase
    .from("user_notifications")
    .insert({
      auth_user_id:
        input.authUserId,

      type:
        input.type,

      title:
        input.title,

      body:
        input.body,

      url:
        input.url,

      entity_type:
        input.entityType ?? null,

      entity_id:
        input.entityId ?? null,

      dedupe_key:
        input.dedupeKey ?? null,
    });

  if (notificationError) {
    throw new Error(
      `No se pudo guardar la notificación: ${notificationError.message}`
    );
  }

  /*
   * =======================================================
   * 3. BUSCAR ÚNICAMENTE LOS DISPOSITIVOS DEL USUARIO
   * =======================================================
   */

  const {
    data,
    error,
  } = await supabase
    .from("push_subscriptions")
    .select(
      "endpoint,p256dh,auth"
    )
    .eq(
      "auth_user_id",
      input.authUserId
    )
    .eq(
      "is_active",
      true
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const subscriptions =
    (data ?? []) as PushSubscriptionRow[];

  /*
   * La notificación interna ya existe,
   * aunque el hermano aún no tenga Push.
   */
  if (
    subscriptions.length === 0
  ) {
    return {
      ok: true,
      skipped: false,
      sent: 0,
      failed: 0,
      noPushDevices: true,
    };
  }

  /*
   * =======================================================
   * 4. PAYLOAD
   * =======================================================
   */

  const payload =
    JSON.stringify({
      title:
        input.title,

      body:
        input.body,

      url:
        input.url,

      icon:
        "/icons/icon-192.png",

      badge:
        "/icons/icon-192.png",

      tag:
        input.tag ??
        input.type,

      requireInteraction:
        false,
    });

  let sent = 0;
  let failed = 0;

  /*
   * =======================================================
   * 5. PUSH
   * =======================================================
   */

  for (
    const subscription of
    subscriptions
  ) {
    try {
      await webpush.sendNotification(
        {
          endpoint:
            subscription.endpoint,

          keys: {
            p256dh:
              subscription.p256dh,

            auth:
              subscription.auth,
          },
        },
        payload
      );

      sent++;
    } catch (error) {
      failed++;

      const statusCode =
        (
          error as {
            statusCode?: number;
          }
        ).statusCode;

      console.error(
        "USER PUSH ERROR:",
        error
      );

      /*
       * Solo desactivamos la suscripción
       * si realmente expiró.
       */
      if (
        statusCode === 404 ||
        statusCode === 410
      ) {
        await supabase
          .from(
            "push_subscriptions"
          )
          .update({
            is_active:
              false,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "endpoint",
            subscription.endpoint
          );
      }
    }
  }

  return {
    ok:
      sent > 0,

    skipped:
      false,

    sent,

    failed,

    devices:
      subscriptions.length,
  };
}