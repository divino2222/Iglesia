import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type WebPushError = {
  statusCode?: number;
  body?: string;
  message?: string;
};

type SendPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  assignmentId?: string | null;
  servicePlanId?: string | null;
};

/* =========================================================
   CONFIGURAR VAPID
========================================================= */

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

/* =========================================================
   ENVIAR A UN USUARIO AUTH
========================================================= */

export async function sendPushToAuthUser({
  authUserId,
  payload,
}: {
  authUserId: string;
  payload: SendPushPayload;
}) {
  configureWebPush();

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("push_subscriptions")
    .select(
      `
      endpoint,
      p256dh,
      auth
      `
    )
    .eq(
      "auth_user_id",
      authUserId
    )
    .eq(
      "is_active",
      true
    );

  if (error) {
    console.error(
      "No se pudieron consultar suscripciones Push:",
      error
    );

    return {
      sent: 0,
      failed: 0,
    };
  }

  const subscriptions =
    (data ?? []) as PushSubscriptionRow[];

  if (
    subscriptions.length === 0
  ) {
    return {
      sent: 0,
      failed: 0,
    };
  }

  const pushPayload =
    JSON.stringify({
      title:
        payload.title,

      body:
        payload.body,

      url:
        payload.url ??
        "/",

      icon:
  "/icons/icon-192.png",

badge:
  "/icons/icon-192.png",

      tag:
        payload.tag ??
        "comunidad-vid",

      requireInteraction:
        Boolean(
          payload.requireInteraction
        ),

      assignmentId:
        payload.assignmentId ??
        null,

      servicePlanId:
        payload.servicePlanId ??
        null,
    });

  let sent = 0;
  let failed = 0;

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

        pushPayload
      );

      sent++;
    } catch (error) {
      failed++;

      const pushError =
        error as WebPushError;

      console.error(
        "WEB PUSH ERROR:",
        {
          statusCode:
            pushError.statusCode,

          message:
            pushError.message,

          body:
            pushError.body,
        }
      );

      /*
       * 404 / 410 normalmente indican
       * una suscripción que ya no existe.
       *
       * Solo en esos casos la desactivamos.
       */
      if (
        pushError.statusCode ===
          404 ||
        pushError.statusCode ===
          410
      ) {
        await supabase
          .from(
            "push_subscriptions"
          )
          .update({
            is_active:
              false,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "endpoint",
            subscription.endpoint
          );
      }
    }
  }

  return {
    sent,
    failed,
  };
}

/* =========================================================
   AVISO DE NUEVA ASIGNACIÓN
========================================================= */

export async function sendNewAssignmentPush({
  profileId,
  servicePlanId,
  teamId,
}: {
  profileId: string;
  servicePlanId: string;
  teamId: string;
}) {
  const supabase =
    createAdminClient();

  /* =======================================================
     PERFIL
  ======================================================= */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      auth_user_id
      `
    )
    .eq(
      "id",
      profileId
    )
    .maybeSingle();

  if (
    profileError ||
    !profile?.auth_user_id
  ) {
    return {
      sent: 0,
      failed: 0,
    };
  }

  /* =======================================================
     SERVICIO
  ======================================================= */

  const {
    data: plan,
  } = await supabase
    .from("service_plans")
    .select(
      `
      id,
      service_date,
      title,
      service_time
      `
    )
    .eq(
      "id",
      servicePlanId
    )
    .maybeSingle();

  /* =======================================================
     EQUIPO
  ======================================================= */

  const {
    data: team,
  } = await supabase
    .from("service_teams")
    .select(
      `
      id,
      team_name,
      arrival_time
      `
    )
    .eq(
      "id",
      teamId
    )
    .maybeSingle();

  const name =
    profile.full_name ||
    "Hola";

  const teamName =
    team?.team_name ||
    "tu equipo";

  const dateLabel =
    plan?.service_date
      ? formatPushDate(
          plan.service_date
        )
      : "el próximo servicio";

  const arrivalText =
    team?.arrival_time
      ? ` Llegada: ${team.arrival_time}.`
      : "";

  return sendPushToAuthUser({
    authUserId:
      profile.auth_user_id,

    payload: {
      title:
        "🙌 Tienes un nuevo servicio",

      body:
        `${name}, fuiste asignado a ${teamName} para ${dateLabel}.${arrivalText} Revisa tu servicio y confirma tu asistencia.`,

      url:
        "/mi-servicio",

      tag:
        `assignment-${servicePlanId}-${teamId}`,

      requireInteraction:
        true,

      servicePlanId,
    },
  });
}

/* =========================================================
   FECHA PARA PUSH
========================================================= */

function formatPushDate(
  dateValue: string
) {
  const [
    year,
    month,
    day,
  ] = dateValue
    .split("-")
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0
    );

  return date.toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );
}