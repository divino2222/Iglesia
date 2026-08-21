"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  BellRing,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

import {
  activatePushNotifications,
  isPushSupported,
} from "@/lib/push/client";

const STORAGE_KEY =
  "comunidad-vid-push-prompt-dismissed";

/* =========================================================
   COMPONENTE
========================================================= */

export default function PushNotificationsPrompt() {
  const [open, setOpen] =
    useState(false);

  const [supported, setSupported] =
    useState(false);

  const [
    permissionState,
    setPermissionState,
  ] = useState<
    NotificationPermission |
      "unsupported"
  >("default");

  const [
    installGatePassed,
    setInstallGatePassed,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  /*
   * Evita ejecutar dos veces la
   * sincronización automática durante
   * el mismo montaje.
   */
  const autoSyncStarted =
    useRef(false);

  /* =========================================================
     SOPORTE + ESTADO INICIAL
  ========================================================= */

  useEffect(() => {
    const pushSupported =
      isPushSupported();

    setSupported(
      pushSupported
    );

    if (!pushSupported) {
      setPermissionState(
        "unsupported"
      );

      return;
    }

    const permission =
      Notification.permission;

    setPermissionState(
      permission
    );

    /* =======================================================
       ESTADO PWA
    ======================================================= */

    const installDismissed =
      window.localStorage.getItem(
        "comunidad-vid-install-prompt-dismissed"
      ) === "true";

    const installed =
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      // @ts-expect-error Safari standalone
      window.navigator
        .standalone === true;

    if (
      installDismissed ||
      installed
    ) {
      setInstallGatePassed(
        true
      );
    }

    const handleInstallClosed =
      () => {
        setInstallGatePassed(
          true
        );
      };

    window.addEventListener(
      "cv-install-prompt-closed",
      handleInstallClosed
    );

    return () => {
      window.removeEventListener(
        "cv-install-prompt-closed",
        handleInstallClosed
      );
    };
  }, []);

  /* =========================================================
     SINCRONIZACIÓN AUTOMÁTICA

     Si Chrome ya tiene permiso "granted",
     registramos/sincronizamos el dispositivo
     aunque el modal ya se haya cerrado antes.
  ========================================================= */

  useEffect(() => {
    if (!supported) {
      return;
    }

    if (
      permissionState !==
      "granted"
    ) {
      return;
    }

    if (
      autoSyncStarted.current
    ) {
      return;
    }

    autoSyncStarted.current =
      true;

    async function syncExistingPermission() {
      try {
        await activatePushNotifications();

        /*
         * Si llega aquí:
         * - existe Service Worker
         * - existe PushSubscription
         * - fue enviada a nuestra API
         */
        console.info(
          "Push de Comunidad VID sincronizado."
        );
      } catch (error) {
        /*
         * No tumbamos Home.
         *
         * Si el usuario no tiene sesión,
         * la API puede responder 401.
         * Lo podremos volver a sincronizar
         * cuando inicie sesión.
         */
        console.warn(
          "No se pudo sincronizar Push:",
          error
        );
      }
    }

    syncExistingPermission();
  }, [
    supported,
    permissionState,
  ]);

  /* =========================================================
     MOSTRAR PROMPT

     Solo necesitamos mostrarlo cuando
     todavía no hay decisión de Chrome.
  ========================================================= */

  useEffect(() => {
    if (!supported) {
      return;
    }

    if (
      !installGatePassed
    ) {
      return;
    }

    /*
     * Si ya está concedido, la
     * sincronización automática anterior
     * se encarga del registro.
     */
    if (
      permissionState ===
      "granted"
    ) {
      return;
    }

    /*
     * Si está bloqueado no insistimos.
     */
    if (
      permissionState ===
      "denied"
    ) {
      return;
    }

    const dismissed =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      dismissed === "true"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setOpen(true);
        },
        1200
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    supported,
    installGatePassed,
    permissionState,
  ]);

  /* =========================================================
     CERRAR
  ========================================================= */

  const close = () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      "true"
    );

    setOpen(false);
  };

  /* =========================================================
     ACTIVAR MANUALMENTE
  ========================================================= */

  const activate =
    async () => {
      if (loading) {
        return;
      }

      setLoading(true);

      setErrorMessage(
        null
      );

      try {
        await activatePushNotifications();

        const permission =
          Notification.permission;

        setPermissionState(
          permission
        );

        setSuccess(true);

        window.localStorage.setItem(
          STORAGE_KEY,
          "true"
        );

        window.setTimeout(
          () => {
            setOpen(false);
          },
          1600
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron activar las notificaciones.";

        setErrorMessage(
          message
        );

        if (
          "Notification" in
          window
        ) {
          setPermissionState(
            Notification.permission
          );
        }
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     NO MOSTRAR
  ========================================================= */

  if (
    !supported ||
    !open ||
    permissionState ===
      "denied"
  ) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <div
        className="fixed inset-0 z-[130] bg-black/30 backdrop-blur-[2px]"
        onClick={
          loading
            ? undefined
            : close
        }
      />

      <div className="fixed inset-x-0 bottom-0 z-[140] mx-auto w-full max-w-md px-3 pb-4">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          {/* CABECERA */}

          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-200 backdrop-blur">
                  <BellRing
                    size={12}
                  />

                  Notificaciones
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {success
                    ? "Notificaciones activadas"
                    : "Mantente al día"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {success
                    ? "Este dispositivo ya puede recibir avisos de Comunidad VID."
                    : "Recibe recordatorios importantes y avisos relacionados con tu servicio."}
                </p>
              </div>

              {!loading &&
              !success ? (
                <button
                  type="button"
                  onClick={
                    close
                  }
                  className="rounded-2xl p-2 text-stone-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                  aria-label="Cerrar"
                >
                  <X
                    size={20}
                  />
                </button>
              ) : null}
            </div>
          </div>

          {/* CONTENIDO */}

          <div className="space-y-4 px-5 py-5">
            {success ? (
              <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Todo listo
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    Podrás recibir avisos aunque Comunidad VID no esté abierta.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    <Bell
                      size={12}
                    />

                    Qué recibirás
                  </div>

                  <ul className="space-y-2 text-sm leading-6 text-stone-700">
                    <li>
                      • Avisos cuando tengas una nueva asignación
                    </li>

                    <li>
                      • Recordatorios si todavía no confirmas
                    </li>

                    <li>
                      • Cambios importantes de coordinación
                    </li>

                    <li>
                      • Oración, eventos y avisos relevantes de Comunidad VID
                    </li>
                  </ul>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700">
                      No pudimos activarlas
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-600">
                      {
                        errorMessage
                      }
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      activate
                    }
                    disabled={
                      loading
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Activando...
                      </>
                    ) : (
                      <>
                        <BellRing
                          size={16}
                        />

                        Activar notificaciones
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      close
                    }
                    disabled={
                      loading
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
                  >
                    Ahora no
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}