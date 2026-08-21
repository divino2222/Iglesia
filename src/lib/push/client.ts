/* =========================================================
   WEB PUSH - CLIENTE
========================================================= */

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    "=".repeat(
      (4 -
        (base64String.length % 4)) %
        4
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) =>
        char.charCodeAt(0)
    )
  );
}

/* =========================================================
   COMPARAR CLAVES
========================================================= */

function arrayBuffersEqual(
  first:
    | ArrayBuffer
    | ArrayBufferView
    | null,
  second: Uint8Array
) {
  if (!first) {
    return false;
  }

  let firstArray: Uint8Array;

  if (
    ArrayBuffer.isView(first)
  ) {
    firstArray =
      new Uint8Array(
        first.buffer,
        first.byteOffset,
        first.byteLength
      );
  } else {
    firstArray =
      new Uint8Array(first);
  }

  if (
    firstArray.length !==
    second.length
  ) {
    return false;
  }

  for (
    let index = 0;
    index <
    firstArray.length;
    index++
  ) {
    if (
      firstArray[index] !==
      second[index]
    ) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   SOPORTE
========================================================= */

export function isPushSupported() {
  return (
    typeof window !==
      "undefined" &&
    "Notification" in window &&
    "serviceWorker" in
      navigator &&
    "PushManager" in window
  );
}

/* =========================================================
   REGISTRAR SERVICE WORKER
========================================================= */

export async function getServiceWorkerRegistration() {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    throw new Error(
      "Este navegador no soporta Service Workers."
    );
  }

  const existing =
    await navigator.serviceWorker.getRegistration(
      "/"
    );

  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register(
    "/sw.js",
    {
      scope: "/",
    }
  );
}

/* =========================================================
   CREAR / RECUPERAR SUSCRIPCIÓN
========================================================= */

export async function getOrCreatePushSubscription() {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "Las notificaciones push no están disponibles en este dispositivo."
    );
  }

  const publicKey =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY."
    );
  }

  const currentApplicationKey =
    urlBase64ToUint8Array(
      publicKey
    );

  const registration =
    await getServiceWorkerRegistration();

  /*
   * Esperamos al Service Worker activo.
   */
  await navigator.serviceWorker.ready;

  /* =======================================================
     REVISAR SUSCRIPCIÓN EXISTENTE
  ======================================================= */

  const existingSubscription =
    await registration.pushManager.getSubscription();

  if (
    existingSubscription
  ) {
    const existingKey =
      existingSubscription
        .options
        .applicationServerKey;

    const sameKey =
      arrayBuffersEqual(
        existingKey,
        currentApplicationKey
      );

    /*
     * Si fue creada con la clave VAPID actual,
     * podemos reutilizarla.
     */
    if (sameKey) {
      return existingSubscription;
    }

    /*
     * Si la clave no coincide,
     * la suscripción pertenece al VAPID anterior.
     *
     * La eliminamos para crear una nueva.
     */
    const unsubscribed =
      await existingSubscription.unsubscribe();

    if (!unsubscribed) {
      throw new Error(
        "No se pudo reemplazar la suscripción Push anterior."
      );
    }
  }

  /* =======================================================
     CREAR SUSCRIPCIÓN CON LA CLAVE ACTUAL
  ======================================================= */

  const subscription =
    await registration.pushManager.subscribe(
      {
        userVisibleOnly: true,

        applicationServerKey:
          currentApplicationKey,
      }
    );

  return subscription;
}

/* =========================================================
   GUARDAR SUSCRIPCIÓN EN SERVIDOR
========================================================= */

export async function savePushSubscription(
  subscription: PushSubscription
) {
  const response =
    await fetch(
      "/api/push/subscribe",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          subscription.toJSON()
        ),
      }
    );

  const result =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        "No se pudo registrar este dispositivo."
    );
  }

  return result;
}

/* =========================================================
   ACTIVAR PUSH COMPLETO
========================================================= */

export async function activatePushNotifications() {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "Este dispositivo no soporta notificaciones push."
    );
  }

  let permission =
    Notification.permission;

  if (
    permission === "default"
  ) {
    permission =
      await Notification.requestPermission();
  }

  if (
    permission !== "granted"
  ) {
    throw new Error(
      "No se concedió permiso para enviar notificaciones."
    );
  }

  const subscription =
    await getOrCreatePushSubscription();

  await savePushSubscription(
    subscription
  );

  return subscription;
}