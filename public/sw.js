/* ============================================================
   COMUNIDAD VID
   SERVICE WORKER
============================================================ */

/* ============================================================
   INSTALACIÓN
============================================================ */

self.addEventListener("install", () => {
  self.skipWaiting();
});

/* ============================================================
   ACTIVACIÓN
============================================================ */

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* ============================================================
   PUSH NOTIFICATIONS
============================================================ */

self.addEventListener("push", (event) => {
  let data = {
    title: "Comunidad VID",
    body: "Tienes una nueva notificación.",
    url: "/",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "comunidad-vid",
    requireInteraction: false,
  };

  /* ----------------------------------------------------------
     LEER PAYLOAD
  ---------------------------------------------------------- */

  if (event.data) {
    try {
      const payload = event.data.json();

      data = {
        ...data,
        ...payload,
      };
    } catch {
      try {
        data.body =
          event.data.text() ||
          "Tienes una nueva notificación.";
      } catch {
        data.body =
          "Tienes una nueva notificación.";
      }
    }
  }

  /* ----------------------------------------------------------
     CONFIGURACIÓN DE NOTIFICACIÓN
  ---------------------------------------------------------- */

  const options = {
    body: data.body,

    icon:
      data.icon ||
      "/icons/icon-192.png",

    badge:
      data.badge ||
      "/icons/icon-192.png",

    tag:
      data.tag ||
      "comunidad-vid",

    renotify: true,

    requireInteraction:
      Boolean(data.requireInteraction),

    vibrate: [200, 100, 200],

    data: {
      url: data.url || "/",

      assignmentId:
        data.assignmentId || null,

      servicePlanId:
        data.servicePlanId || null,

      type:
        data.type || null,
    },
  };

  /* ----------------------------------------------------------
     MOSTRAR NOTIFICACIÓN
  ---------------------------------------------------------- */

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Comunidad VID",
      options
    )
  );
});

/* ============================================================
   CLICK EN NOTIFICACIÓN
============================================================ */

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url || "/";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(async (windowClients) => {
          /*
           * Si Comunidad VID ya está abierta,
           * reutilizamos la ventana existente.
           */

          for (const client of windowClients) {
            try {
              const clientUrl =
                new URL(client.url);

              if (
                clientUrl.origin ===
                self.location.origin
              ) {
                await client.focus();

                if ("navigate" in client) {
                  return client.navigate(
                    targetUrl
                  );
                }

                return client;
              }
            } catch {
              // Ignoramos clientes cuya URL
              // no pueda interpretarse.
            }
          }

          /*
           * Si la app está cerrada,
           * abrimos una nueva ventana.
           */

          if (
            self.clients.openWindow
          ) {
            return self.clients.openWindow(
              targetUrl
            );
          }

          return undefined;
        })
    );
  }
);

/* ============================================================
   CIERRE DE NOTIFICACIÓN
   Lo dejamos preparado para analítica futura.
============================================================ */

self.addEventListener(
  "notificationclose",
  () => {
    // Aquí podremos registrar más adelante
    // cuándo un usuario descarta una notificación.
  }
);