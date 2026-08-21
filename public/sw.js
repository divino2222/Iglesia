/* public/sw.js */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Comunidad VID",
    body: "Tienes una nueva notificación.",
    url: "/",
    icon:
  "/icons/icon-192.png",

badge:
  "/icons/icon-192.png",
    tag: "comunidad-vid",
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json(),
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    requireInteraction: Boolean(data.requireInteraction),
    data: {
      url: data.url || "/",
      assignmentId: data.assignmentId || null,
      servicePlanId: data.servicePlanId || null,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
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
        for (const client of windowClients) {
          const clientUrl = new URL(client.url);

          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            return client.navigate(targetUrl);
          }
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});