"use client";

import {
  BellRing,
  CheckCircle2,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import {
  useState,
} from "react";

type TestResult = {
  ok?: boolean;
  sent?: number;
  failed?: number;
  message?: string;
  error?: string;
};

export default function PushTestButton() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState<TestResult | null>(
    null
  );

  async function sendTest() {
    if (loading) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response =
        await fetch(
          "/api/push/test",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        (await response
          .json()
          .catch(
            () => null
          )) as TestResult | null;

      if (!response.ok) {
        setResult({
          ok: false,

          error:
            data?.error ||
            "No se pudo enviar la notificación.",
        });

        return;
      }

      setResult(
        data ?? {
          ok: false,
          error:
            "El servidor no devolvió una respuesta válida.",
        }
      );
    } catch (error) {
      setResult({
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error enviando la prueba.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[30px] border border-violet-200 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
        Prueba temporal
      </p>

      <h2 className="mt-2 text-xl font-semibold text-stone-950">
        Notificaciones Push
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-600">
        Envía una notificación real a los dispositivos
        registrados con tu cuenta.
      </p>

      <button
        type="button"
        onClick={sendTest}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />

            Enviando...
          </>
        ) : (
          <>
            <BellRing
              size={18}
            />

            Enviar notificación de prueba
          </>
        )}
      </button>

      {result?.ok ? (
        <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Notificación enviada
            </p>

            <p className="mt-1 text-xs leading-5">
              Enviadas:{" "}
              {result.sent ?? 0}
              {" · "}
              Fallidas:{" "}
              {result.failed ?? 0}
            </p>
          </div>
        </div>
      ) : null}

      {result &&
      result.ok === false ? (
        <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-red-200 bg-red-50 p-4 text-red-700">
          <TriangleAlert
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              No se pudo enviar
            </p>

            <p className="mt-1 text-xs leading-5">
              {result.error ||
                result.message ||
                "Ocurrió un error."}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}