"use client";

import { useEffect } from "react";

export default function PushDeviceSync() {
  useEffect(() => {
    let cancelled = false;

    async function syncSubscription() {
      try {
        if (!("serviceWorker" in navigator)) return;
        if (!("PushManager" in window)) return;

        if (Notification.permission !== "granted") {
          return;
        }

        const registration = await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (!subscription || cancelled) {
          return;
        }

        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription.toJSON()),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);

          console.warn(
            "No se pudo sincronizar el dispositivo:",
            result
          );
        }
      } catch (error) {
        console.warn("PushDeviceSync:", error);
      }
    }

    syncSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}