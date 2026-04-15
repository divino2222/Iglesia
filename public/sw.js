self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  self.registration.showNotification(data.title || "Comunidad VID", {
    body: data.body || "",
    icon: "/icon-192x192.png",
  });
});