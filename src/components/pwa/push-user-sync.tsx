"use client";

import { useEffect } from "react";

export default function PushUserSync() {
  useEffect(() => {
    let cancelled = false;

    async function syncPushUser() {
      try {
        /*
         * Debe existir Service Worker.
         */
        if (!("serviceWorker" in navigator)) {
          return;
        }

        /*
         * Y las notificaciones deben estar autorizadas.
         */
        if (
          !("Notification" in window) ||
          Notification.permission !== "granted"
        ) {
          return;
        }

        const registration =
          await navigator.serviceWorker.ready;

        if (cancelled) return;

        /*
         * Recuperamos la suscripción que YA tienes.
         */
        const subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          return;
        }

        /*
         * Vinculamos ese endpoint con el usuario
         * autenticado actual.
         */
        await fetch("/api/push/link-current-device", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      } catch (error) {
        /*
         * No bloqueamos la aplicación si falla.
         */
        console.error("PUSH USER SYNC ERROR:", error);
      }
    }

    syncPushUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}