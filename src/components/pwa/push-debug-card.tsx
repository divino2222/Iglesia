"use client";

import { useEffect, useState } from "react";

type DebugStatus = {
  notificationPermission:
    | NotificationPermission
    | "unsupported";

  serviceWorker:
    | "checking"
    | "active"
    | "missing"
    | "unsupported";

  pushSubscription:
    | "checking"
    | "registered"
    | "missing"
    | "unsupported";

  supabase:
    | "checking"
    | "saved"
    | "missing"
    | "error";
};

export default function PushDebugCard() {
  const [status, setStatus] =
    useState<DebugStatus>({
      notificationPermission:
        "unsupported",

      serviceWorker:
        "checking",

      pushSubscription:
        "checking",

      supabase:
        "checking",
    });

  const [details, setDetails] =
    useState<string | null>(null);

  useEffect(() => {
    async function runDiagnostics() {
      /* =====================================================
         1. SOPORTE DE NOTIFICACIONES
      ===================================================== */

      const notificationsSupported =
        typeof window !==
          "undefined" &&
        "Notification" in window;

      const serviceWorkerSupported =
        typeof navigator !==
          "undefined" &&
        "serviceWorker" in navigator;

      const pushSupported =
        typeof window !==
          "undefined" &&
        "PushManager" in window;

      if (
        !notificationsSupported
      ) {
        setStatus({
          notificationPermission:
            "unsupported",

          serviceWorker:
            serviceWorkerSupported
              ? "missing"
              : "unsupported",

          pushSubscription:
            "unsupported",

          supabase:
            "missing",
        });

        setDetails(
          "Este navegador no soporta Notification API."
        );

        return;
      }

      const permission =
        Notification.permission;

      /* =====================================================
         2. SERVICE WORKER
      ===================================================== */

      if (
        !serviceWorkerSupported
      ) {
        setStatus({
          notificationPermission:
            permission,

          serviceWorker:
            "unsupported",

          pushSubscription:
            "unsupported",

          supabase:
            "missing",
        });

        setDetails(
          "Este navegador no soporta Service Workers."
        );

        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

      const serviceWorkerState =
        registration
          ? "active"
          : "missing";

      /* =====================================================
         3. PUSH SUBSCRIPTION
      ===================================================== */

      let subscription:
        | PushSubscription
        | null = null;

      if (
        registration &&
        pushSupported
      ) {
        subscription =
          await registration.pushManager.getSubscription();
      }

      const pushSubscriptionState =
        !pushSupported
          ? "unsupported"
          : subscription
            ? "registered"
            : "missing";

      /* =====================================================
         4. CONSULTAR SI ESTÁ GUARDADA EN SUPABASE

         La API debe devolver si el endpoint actual
         existe en push_subscriptions.
      ===================================================== */

      let supabaseState:
        | "saved"
        | "missing"
        | "error" =
        "missing";

      if (subscription) {
        try {
          const endpoint =
            encodeURIComponent(
              subscription.endpoint
            );

          const response =
            await fetch(
              `/api/push/status?endpoint=${endpoint}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          if (
            response.ok &&
            result?.saved === true
          ) {
            supabaseState =
              "saved";
          } else if (
            response.ok
          ) {
            supabaseState =
              "missing";
          } else {
            supabaseState =
              "error";
          }
        } catch {
          supabaseState =
            "error";
        }
      }

      setStatus({
        notificationPermission:
          permission,

        serviceWorker:
          serviceWorkerState,

        pushSubscription:
          pushSubscriptionState,

        supabase:
          supabaseState,
      });

      if (subscription) {
        setDetails(
          subscription.endpoint
        );
      } else {
        setDetails(
          "No existe PushSubscription para este navegador."
        );
      }
    }

    runDiagnostics();
  }, []);

  function getBadge(
    state: string
  ) {
    if (
      state === "granted" ||
      state === "active" ||
      state === "registered" ||
      state === "saved"
    ) {
      return {
        icon: "✅",
        label:
          state === "granted"
            ? "Concedido"
            : state === "active"
              ? "Activo"
              : state ===
                  "registered"
                ? "Registrada"
                : "Guardada",
        className:
          "bg-emerald-100 text-emerald-700",
      };
    }

    if (
      state === "checking"
    ) {
      return {
        icon: "⏳",
        label:
          "Revisando",
        className:
          "bg-stone-100 text-stone-600",
      };
    }

    if (
      state === "error"
    ) {
      return {
        icon: "❌",
        label:
          "Error",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (
      state === "denied"
    ) {
      return {
        icon: "🚫",
        label:
          "Bloqueado",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (
      state === "default"
    ) {
      return {
        icon: "🟡",
        label:
          "Sin decidir",
        className:
          "bg-amber-100 text-amber-700",
      };
    }

    if (
      state ===
      "unsupported"
    ) {
      return {
        icon: "⚪",
        label:
          "No soportado",
        className:
          "bg-stone-100 text-stone-600",
      };
    }

    return {
      icon: "❌",
      label:
        "No registrado",
      className:
        "bg-red-100 text-red-700",
    };
  }

  const permissionBadge =
    getBadge(
      status.notificationPermission
    );

  const serviceWorkerBadge =
    getBadge(
      status.serviceWorker
    );

  const subscriptionBadge =
    getBadge(
      status.pushSubscription
    );

  const supabaseBadge =
    getBadge(
      status.supabase
    );

  return (
    <section className="rounded-[30px] border border-violet-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
        Diagnóstico temporal
      </p>

      <h2 className="mt-2 text-xl font-semibold text-stone-950">
        Estado de notificaciones
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-600">
        Esta tarjeta nos ayuda a revisar
        la conexión Push de este navegador.
      </p>

      <div className="mt-5 space-y-3">
        <DebugRow
          label="Permiso Chrome"
          badge={
            permissionBadge
          }
        />

        <DebugRow
          label="Service Worker"
          badge={
            serviceWorkerBadge
          }
        />

        <DebugRow
          label="Suscripción Push"
          badge={
            subscriptionBadge
          }
        />

        <DebugRow
          label="Supabase"
          badge={
            supabaseBadge
          }
        />
      </div>

      {details ? (
        <div className="mt-4 rounded-2xl bg-stone-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Detalle
          </p>

          <p className="mt-1 break-all text-xs leading-5 text-stone-600">
            {details}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function DebugRow({
  label,
  badge,
}: {
  label: string;

  badge: {
    icon: string;
    label: string;
    className: string;
  };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
      <span className="text-sm font-semibold text-stone-700">
        {label}
      </span>

      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
      >
        <span>
          {badge.icon}
        </span>

        {badge.label}
      </span>
    </div>
  );
}