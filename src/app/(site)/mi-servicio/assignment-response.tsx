"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { respondToAssignmentAction } from "./actions";

type Props = {
  assignmentId: string;
  currentStatus: string;
};

export default function AssignmentResponse({
  assignmentId,
  currentStatus,
}: Props) {
  const [status, setStatus] =
    useState(currentStatus);

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState<
      "confirmed" |
      "change_requested" |
      null
    >(null);

  const [message, setMessage] =
    useState<string | null>(null);

  async function respond(
    response:
      | "confirmed"
      | "change_requested"
  ) {
    setLoading(response);
    setMessage(null);

    const result =
      await respondToAssignmentAction(
        assignmentId,
        response,
        note
      );

    setLoading(null);

    if (!result.success) {
      setMessage(
        result.error ||
          "No se pudo guardar tu respuesta."
      );
      return;
    }

    setStatus(response);

    setMessage(
      response === "confirmed"
        ? "Tu asistencia quedó confirmada."
        : "Tu solicitud de cambio fue enviada."
    );
  }

  if (status === "confirmed") {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={22}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <div>
            <p className="font-semibold text-emerald-900">
              Asistencia confirmada
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              Gracias por confirmar tu servicio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    status ===
    "change_requested"
  ) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <RefreshCw
            size={22}
            className="mt-0.5 shrink-0 text-red-700"
          />

          <div>
            <p className="font-semibold text-red-900">
              Cambio solicitado
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              El líder de tu ministerio y coordinación podrán revisar tu solicitud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() =>
          respond("confirmed")
        }
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-semibold text-white disabled:opacity-60"
      >
        {loading === "confirmed" ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <CheckCircle2 size={18} />
        )}

        Confirmar asistencia
      </button>

      <div className="rounded-[28px] border border-stone-200 bg-white p-4">
        <label className="block text-sm font-semibold text-stone-700">
          Motivo del cambio
        </label>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(
              event.target.value
            )
          }
          rows={3}
          placeholder="Ej. No podré asistir por un compromiso familiar."
          className="mt-3 w-full resize-none rounded-2xl border border-stone-200 p-4 outline-none focus:border-stone-500"
        />

        <button
          type="button"
          disabled={loading !== null}
          onClick={() =>
            respond(
              "change_requested"
            )
          }
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ===
          "change_requested" ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <RefreshCw size={18} />
          )}

          Solicitar cambio
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}