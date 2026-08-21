"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

type State =
  | "idle"
  | "sending"
  | "success"
  | "error";

export default function PushTestButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function sendTest() {
    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setState("error");

        setMessage(
          result.error ||
            "No pudimos enviar la notificación."
        );

        return;
      }

      setState("success");

      setMessage(
        result.sent === 1
          ? "Notificación enviada a este dispositivo."
          : `Notificación enviada a ${result.sent} dispositivos.`
      );
    } catch {
      setState("error");

      setMessage(
        "No pudimos comunicarnos con el servidor."
      );
    }
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Bell size={19} />
        </div>

        <div>
          <p className="font-semibold text-stone-950">
            Probar notificaciones
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-500">
            Envía un aviso real a los dispositivos vinculados con tu cuenta.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={state === "sending"}
        onClick={sendTest}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {state === "sending" ? (
          <>
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
            Enviando...
          </>
        ) : (
          <>
            <Bell size={17} />
            Enviar notificación de prueba
          </>
        )}
      </button>

      {state === "success" ? (
        <div className="mt-3 flex gap-2 rounded-[18px] bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />
          {message}
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-3 flex gap-2 rounded-[18px] bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert
            size={17}
            className="mt-0.5 shrink-0"
          />
          {message}
        </div>
      ) : null}
    </div>
  );
}