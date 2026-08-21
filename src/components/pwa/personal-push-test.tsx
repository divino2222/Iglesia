"use client";

import { useState } from "react";
import { BellRing, Monitor, Smartphone } from "lucide-react";

type TestUser = {
  name: string;
  email: string;
  device: string;
  icon: "phone" | "pc";
};

const testUsers: TestUser[] = [
  {
    name: "Alan",
    email: "alantox10@hotmail.com",
    device: "Teléfono",
    icon: "phone",
  },
  {
    name: "José Luis Aguilar",
    email: "pastor@prueba.com",
    device: "PC",
    icon: "pc",
  },
];

export default function PersonalPushTest({
  pin,
}: {
  pin: string;
}) {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function sendTest(user: TestUser) {
    try {
      setLoadingEmail(user.email);
      setMessage("");

      const response = await fetch("/api/push/test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          pin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(
          data.error || `No se pudo enviar la notificación a ${user.name}.`
        );
        return;
      }

      setMessage(
        `✅ ${user.name}: enviadas ${data.sent}, fallidas ${data.failed}, dispositivos ${data.devices}.`
      );
    } catch {
      setMessage("Ocurrió un error al enviar la prueba.");
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-white">
          <BellRing size={20} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            Prueba temporal
          </p>

          <h2 className="mt-1 text-xl font-semibold text-stone-950">
            Push personalizado
          </h2>

          <p className="mt-1 text-sm leading-5 text-stone-600">
            Comprueba que cada aviso llegue únicamente al dispositivo del
            usuario seleccionado.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {testUsers.map((user) => {
          const loading = loadingEmail === user.email;

          return (
            <div
              key={user.email}
              className="rounded-[24px] border border-stone-100 bg-stone-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700">
                  {user.icon === "phone" ? (
                    <Smartphone size={20} />
                  ) : (
                    <Monitor size={20} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-950">
                    {user.name}
                  </p>

                  <p className="text-xs text-stone-500">
                    {user.device} · {user.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loadingEmail !== null}
                onClick={() => sendTest(user)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <BellRing size={16} />

                {loading
                  ? "Enviando..."
                  : `Enviar solo a ${user.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {message ? (
        <div className="mt-4 rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
    </section>
  );
}