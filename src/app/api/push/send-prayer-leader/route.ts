import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getPrayerLeaderState } from "@/lib/prayer-leader";
import { buildPrayerPushMessage } from "@/lib/push-message-builder";

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

export async function POST() {
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

    const prayerState = await getPrayerLeaderState();

    if (!prayerState.currentLeader && !prayerState.nextLeader) {
      return NextResponse.json(
        { ok: false, message: "No hay líder de oración disponible." },
        { status: 200 }
      );
    }

    const message = buildPrayerPushMessage({
      leaderName: prayerState.isPrayerActiveNow
        ? prayerState.currentLeader
        : prayerState.nextLeader,
      dateLabel: prayerState.nextDateLabel,
      isActiveNow: prayerState.isPrayerActiveNow,
    });

    const { data, error } = await supabaseAdmin.client
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,is_active")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      url: message.url,
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

    return NextResponse.json({
      ok: true,
      message,
      sent,
      failed,
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