import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return {
      ok: false as const,
      error:
        "Faltan variables VAPID. Revisa VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
    };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { ok: true as const };
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return {
      ok: false as const,
      error:
        "Faltan variables de Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  return {
    ok: true as const,
    client: createClient(url, serviceRole),
  };
}

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function parseTimeTo24Hour(
  time: string | null | undefined,
  fallbackHour = 21,
  fallbackMinute = 0
) {
  if (!time) return { hour: fallbackHour, minute: fallbackMinute };

  const normalized = time.toLowerCase().trim();

  const match12 = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const meridiem = match12[3];

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  const match24 = normalized.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    return {
      hour: Number(match24[1]),
      minute: Number(match24[2]),
    };
  }

  return { hour: fallbackHour, minute: fallbackMinute };
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function buildDateTime(dateStr: string, timeStr: string | null) {
  const base = parseLocalDate(dateStr);
  const parsed = parseTimeTo24Hour(timeStr, 21, 0);
  base.setHours(parsed.hour, parsed.minute, 0, 0);
  return base;
}

function formatSpanishDate(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

export async function GET() {
  try {
    const vapid = configureWebPush();
    if (!vapid.ok) {
      return NextResponse.json(
        { ok: false, error: vapid.error },
        { status: 500 }
      );
    }

    const supabaseAdmin = getAdminSupabase();
    if (!supabaseAdmin.ok) {
      return NextResponse.json(
        { ok: false, error: supabaseAdmin.error },
        { status: 500 }
      );
    }

    const now = getMexicoCityNow();

    const { data: eventsData, error: eventsError } = await supabaseAdmin.client
      .from("events")
      .select("id,title,event_date,event_time,leader_name")
      .eq("title", "Noche de oración")
      .order("event_date", { ascending: true });

    if (eventsError) {
      return NextResponse.json(
        { ok: false, error: eventsError.message },
        { status: 500 }
      );
    }

    const events = ((eventsData ?? []) as PrayerEvent[])
      .filter((event) => !!event.event_date)
      .map((event) => {
        const startsAt = buildDateTime(event.event_date as string, event.event_time);
        return { ...event, startsAt };
      })
      .filter((event) => event.startsAt.getTime() > now.getTime())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    const nextPrayer = events[0];

    if (!nextPrayer) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No hay próxima oración.",
      });
    }

    const diffMs = nextPrayer.startsAt.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 20 || diffMinutes > 40) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Fuera de ventana. Faltan ${diffMinutes} min.`,
      });
    }

    const dedupeKey = `prayer-${nextPrayer.event_date}-${nextPrayer.event_time}`;

    const { data: existingLog } = await supabaseAdmin.client
      .from("push_delivery_log")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Ya se envió este recordatorio.",
      });
    }

    const { data: subsData, error: subsError } = await supabaseAdmin.client
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,is_active")
      .eq("is_active", true);

    if (subsError) {
      return NextResponse.json(
        { ok: false, error: subsError.message },
        { status: 500 }
      );
    }

    const subscriptions = (subsData ?? []) as PushSubscriptionRow[];

    const payload = JSON.stringify({
      title: "Comunidad VID",
      body: `Hoy hay oración en línea. Dirige ${
        nextPrayer.leader_name || "la persona asignada"
      } a las ${nextPrayer.event_time || "9:00 PM"} · ${formatSpanishDate(
        nextPrayer.startsAt
      )}.`,
      url: "/eventos",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        sent++;
      } catch {
        failed++;

        await supabaseAdmin.client
          .from("push_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("endpoint", sub.endpoint);
      }
    }

    await supabaseAdmin.client.from("push_delivery_log").insert({
      kind: "prayer-reminder",
      dedupe_key: dedupeKey,
      payload: {
        leader_name: nextPrayer.leader_name,
        event_date: nextPrayer.event_date,
        event_time: nextPrayer.event_time,
        sent,
        failed,
      },
    });

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      leader: nextPrayer.leader_name,
      event_date: nextPrayer.event_date,
      event_time: nextPrayer.event_time,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error interno",
      },
      { status: 500 }
    );
  }
}