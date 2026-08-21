import { NextResponse } from "next/server";
import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   TIPOS
========================================================= */

type PrayerEvent = {
  id: number;
  title: string;
  event_date: string | null;
  event_time: string | null;
  leader_name: string | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  is_active: boolean;
};

/* =========================================================
   SEGURIDAD CRON
========================================================= */

function isAuthorized(
  request: Request
) {
  const isDevelopment =
    process.env.NODE_ENV !==
    "production";

  /*
   * En localhost permitimos
   * ejecutar manualmente.
   */
  if (isDevelopment) {
    return true;
  }

  const secret =
    process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  return (
    authorization ===
    `Bearer ${secret}`
  );
}

/* =========================================================
   CONFIGURAR WEB PUSH
========================================================= */

function configureWebPush() {
  const subject =
    process.env.VAPID_SUBJECT;

  const publicKey =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env
      .VAPID_PRIVATE_KEY;

  if (
    !subject ||
    !publicKey ||
    !privateKey
  ) {
    return {
      ok: false as const,

      error:
        "Faltan variables VAPID. Revisa VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
    };
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );

  return {
    ok: true as const,
  };
}

/* =========================================================
   HORA CDMX COMO RELOJ LOCAL
========================================================= */

function getMexicoCityNowParts() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Mexico_City",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",

        hourCycle: "h23",
      }
    ).formatToParts(
      new Date()
    );

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ]
      )
    );

  return {
    year:
      Number(values.year),

    month:
      Number(values.month),

    day:
      Number(values.day),

    hour:
      Number(values.hour),

    minute:
      Number(values.minute),

    second:
      Number(values.second),
  };
}

/* =========================================================
   PARSEAR HORA
========================================================= */

function parseTimeTo24Hour(
  time:
    | string
    | null
    | undefined,

  fallbackHour = 21,

  fallbackMinute = 0
) {
  if (!time) {
    return {
      hour:
        fallbackHour,

      minute:
        fallbackMinute,
    };
  }

  const normalized =
    time
      .toLowerCase()
      .trim()
      .replace(/\./g, "");

  /*
   * Ej:
   * 9:00 pm
   * 09:00 PM
   */
  const match12 =
    normalized.match(
      /(\d{1,2}):(\d{2})\s*(am|pm)/
    );

  if (match12) {
    let hour =
      Number(
        match12[1]
      );

    const minute =
      Number(
        match12[2]
      );

    const meridiem =
      match12[3];

    if (
      meridiem === "pm" &&
      hour !== 12
    ) {
      hour += 12;
    }

    if (
      meridiem === "am" &&
      hour === 12
    ) {
      hour = 0;
    }

    return {
      hour,
      minute,
    };
  }

  /*
   * Ej:
   * 21:00
   */
  const match24 =
    normalized.match(
      /(\d{1,2}):(\d{2})/
    );

  if (match24) {
    return {
      hour:
        Number(
          match24[1]
        ),

      minute:
        Number(
          match24[2]
        ),
    };
  }

  return {
    hour:
      fallbackHour,

    minute:
      fallbackMinute,
  };
}

/* =========================================================
   CONVERTIR FECHA/HORA LOCAL A VALOR COMPARABLE

   No buscamos convertir realmente
   a UTC.

   Creamos una representación numérica
   consistente del reloj local de CDMX
   para poder calcular minutos faltantes.
========================================================= */

function localDateTimeValue(
  dateStr: string,
  timeStr:
    | string
    | null
) {
  const [
    year,
    month,
    day,
  ] =
    dateStr
      .split("-")
      .map(Number);

  const {
    hour,
    minute,
  } =
    parseTimeTo24Hour(
      timeStr,
      21,
      0
    );

  return Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );
}

/* =========================================================
   AHORA EN VALOR LOCAL CDMX
========================================================= */

function getMexicoCityNowValue() {
  const now =
    getMexicoCityNowParts();

  return Date.UTC(
    now.year,
    now.month - 1,
    now.day,
    now.hour,
    now.minute,
    now.second,
    0
  );
}

/* =========================================================
   FECHA EN ESPAÑOL
========================================================= */

function formatSpanishDate(
  dateStr: string
) {
  const [
    year,
    month,
    day,
  ] =
    dateStr
      .split("-")
      .map(Number);

  /*
   * Usamos mediodía UTC para evitar
   * cambios accidentales de día.
   */
  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  return date.toLocaleDateString(
    "es-MX",
    {
      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      timeZone:
        "America/Mexico_City",
    }
  );
}

/* =========================================================
   FORMATEAR HORA
========================================================= */

function formatPrayerTime(
  time:
    | string
    | null
) {
  if (!time) {
    return "9:00 PM";
  }

  return time;
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       1. SEGURIDAD
    ====================================================== */

    if (
      !isAuthorized(
        request
      )
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. VAPID
    ====================================================== */

    const vapid =
      configureWebPush();

    if (!vapid.ok) {
      return NextResponse.json(
        {
          ok: false,

          error:
            vapid.error,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       3. SUPABASE ADMIN
    ====================================================== */

    const supabase =
      createAdminClient();

    const nowValue =
      getMexicoCityNowValue();

    /* =====================================================
       4. BUSCAR NOCHES DE ORACIÓN
    ====================================================== */

    const {
      data: eventsData,
      error:
        eventsError,
    } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        event_date,
        event_time,
        leader_name
        `
      )
      .eq(
        "title",
        "Noche de oración"
      )
      .order(
        "event_date",
        {
          ascending:
            true,
        }
      );

    if (eventsError) {
      return NextResponse.json(
        {
          ok: false,

          error:
            eventsError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       5. CONSTRUIR PRÓXIMA ORACIÓN
    ====================================================== */

    const events =
      (
        (eventsData ??
          []) as PrayerEvent[]
      )
        .filter(
          (
            event
          ): event is PrayerEvent & {
            event_date: string;
          } =>
            Boolean(
              event.event_date
            )
        )
        .map(
          (event) => ({
            ...event,

            startsAtValue:
              localDateTimeValue(
                event.event_date,
                event.event_time
              ),
          })
        )
        .filter(
          (event) =>
            event.startsAtValue >
            nowValue
        )
        .sort(
          (a, b) =>
            a.startsAtValue -
            b.startsAtValue
        );

    const nextPrayer =
      events[0];

    if (!nextPrayer) {
      return NextResponse.json({
        ok: true,

        skipped: true,

        reason:
          "No hay próxima oración programada.",
      });
    }

    /* =====================================================
       6. MINUTOS RESTANTES
    ====================================================== */

    const diffMs =
      nextPrayer.startsAtValue -
      nowValue;

    const diffMinutes =
      Math.floor(
        diffMs /
          60_000
      );

    /*
     * El cron se ejecutará
     * aproximadamente 30 minutos antes.
     *
     * Permitimos margen de 20 a 40 minutos.
     */
    if (
      diffMinutes < 20 ||
      diffMinutes > 40
    ) {
      return NextResponse.json({
        ok: true,

        skipped: true,

        reason:
          `Fuera de ventana. Faltan ${diffMinutes} min.`,

        nextPrayer: {
          id:
            nextPrayer.id,

          event_date:
            nextPrayer.event_date,

          event_time:
            nextPrayer.event_time,

          leader_name:
            nextPrayer.leader_name,
        },
      });
    }

    /* =====================================================
       7. EVITAR DUPLICADOS
    ====================================================== */

    const dedupeKey =
      `prayer-reminder-${nextPrayer.id}-${nextPrayer.event_date}-${nextPrayer.event_time ?? "21:00"}`;

    const {
      data:
        existingLog,

      error:
        existingLogError,
    } = await supabase
      .from(
        "push_delivery_log"
      )
      .select("id")
      .eq(
        "dedupe_key",
        dedupeKey
      )
      .maybeSingle();

    if (
      existingLogError
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            `No se pudo revisar el historial Push: ${existingLogError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    if (existingLog) {
      return NextResponse.json({
        ok: true,

        skipped: true,

        reason:
          "Ya se envió este recordatorio.",
      });
    }

    /* =====================================================
       8. SUSCRIPCIONES ACTIVAS
    ====================================================== */

    const {
      data:
        subscriptionsData,

      error:
        subscriptionsError,
    } = await supabase
      .from(
        "push_subscriptions"
      )
      .select(
        `
        endpoint,
        p256dh,
        auth,
        is_active
        `
      )
      .eq(
        "is_active",
        true
      );

    if (
      subscriptionsError
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            subscriptionsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const subscriptions =
      (
        subscriptionsData ??
        []
      ) as PushSubscriptionRow[];

    if (
      subscriptions.length ===
      0
    ) {
      return NextResponse.json({
        ok: true,

        skipped: true,

        reason:
          "No hay dispositivos Push activos.",
      });
    }

    /* =====================================================
       9. MENSAJE
    ====================================================== */

    const leaderName =
      nextPrayer.leader_name
        ?.trim() ||
      "el líder asignado";

    const dateText =
      formatSpanishDate(
        nextPrayer.event_date
      );

    const timeText =
      formatPrayerTime(
        nextPrayer.event_time
      );

    const payload =
      JSON.stringify({
        title:
          "🙏 Oración en Comunidad VID",

        body:
          `En 30 minutos comenzamos nuestra noche de oración. Hoy dirige ${leaderName}. ${dateText} · ${timeText}.`,

        url:
          "/eventos",

        icon:
          "/icons/icon-192.png",

        badge:
          "/icons/icon-192.png",

        tag:
          `prayer-${nextPrayer.id}`,

        requireInteraction:
          false,
      });

    /* =====================================================
       10. ENVIAR PUSH
    ====================================================== */

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
          payload
        );

        sent++;
      } catch (error) {
        failed++;

        const statusCode =
          (
            error as {
              statusCode?:
                number;
            }
          ).statusCode;

        console.error(
          "ERROR PUSH ORACIÓN:",
          error
        );

        /*
         * 404 / 410:
         * la suscripción ya murió.
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

    /* =====================================================
       11. GUARDAR LOG

       Solo guardamos dedupe si
       realmente se entregó al menos
       a un dispositivo.
    ====================================================== */

    if (sent > 0) {
      const {
        error:
          insertLogError,
      } = await supabase
        .from(
          "push_delivery_log"
        )
        .insert({
          kind:
            "prayer-reminder",

          dedupe_key:
            dedupeKey,

          payload: {
            event_id:
              nextPrayer.id,

            leader_name:
              nextPrayer.leader_name,

            event_date:
              nextPrayer.event_date,

            event_time:
              nextPrayer.event_time,

            minutes_before:
              diffMinutes,

            sent,

            failed,
          },
        });

      if (
        insertLogError
      ) {
        console.error(
          "No se pudo guardar push_delivery_log:",
          insertLogError
        );
      }
    }

    /* =====================================================
       12. RESULTADO
    ====================================================== */

    return NextResponse.json({
      ok:
        sent > 0,

      sent,

      failed,

      subscriptions:
        subscriptions.length,

      event: {
        id:
          nextPrayer.id,

        date:
          nextPrayer.event_date,

        time:
          nextPrayer.event_time,

        leader:
          nextPrayer.leader_name,

        minutesUntil:
          diffMinutes,
      },

      message:
        sent > 0
          ? "Recordatorio de oración enviado."
          : "No se pudo enviar el recordatorio.",
    });
  } catch (error) {
    console.error(
      "AUTO PRAYER REMINDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}