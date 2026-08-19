"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  UserRoundPlus,
} from "lucide-react";

import {
  replaceAssignmentAction,
  returnAssignmentToPendingAction,
} from "@/app/(site)/mi-ministerio/actions";

type ReplacementOption = {
  id: string;
  name: string;
  position: string | null;
};

type Props = {
  assignmentId: string;
  memberName: string;
  memberPosition: string | null;
  note: string | null;
  replacements: ReplacementOption[];
};

export default function MinistryChangeManager({
  assignmentId,
  memberName,
  memberPosition,
  note,
  replacements,
}: Props) {
  const router = useRouter();

  const [
    replacementProfileId,
    setReplacementProfileId,
  ] = useState("");

  const [loading, setLoading] =
    useState<
      "replace" |
      "pending" |
      null
    >(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [resolved, setResolved] =
    useState(false);

  async function replace() {
    if (!replacementProfileId) {
      setMessage(
        "Selecciona una persona para reemplazar esta asignación."
      );
      return;
    }

    setLoading("replace");
    setMessage(null);

    try {
      const result =
        await replaceAssignmentAction(
          assignmentId,
          replacementProfileId
        );

      if (!result.success) {
        setMessage(
          result.error ||
            "No se pudo guardar el reemplazo."
        );
        return;
      }

      setResolved(true);
      setMessage(
        "El reemplazo fue asignado correctamente."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el reemplazo."
      );
    } finally {
      setLoading(null);
    }
  }

  async function returnToPending() {
    setLoading("pending");
    setMessage(null);

    try {
      const result =
        await returnAssignmentToPendingAction(
          assignmentId
        );

      if (!result.success) {
        setMessage(
          result.error ||
            "No se pudo actualizar la solicitud."
        );
        return;
      }

      setResolved(true);
      setMessage(
        "La asignación regresó a estado pendiente."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al actualizar la solicitud."
      );
    } finally {
      setLoading(null);
    }
  }

  if (resolved) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <div>
            <p className="font-semibold text-emerald-900">
              Solicitud atendida
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-[30px] border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">
            Solicitud de cambio
          </p>

          <h3 className="mt-2 text-lg font-semibold text-stone-950">
            {memberName}
          </h3>

          <p className="mt-1 text-sm text-stone-500">
            {memberPosition || "Servidor"}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <RefreshCw size={20} />
        </div>
      </div>

      {note ? (
        <div className="mt-4 rounded-2xl bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-500">
            Motivo
          </p>

          <p className="mt-2 text-sm leading-6 text-red-800">
            {note}
          </p>
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-stone-700">
          Seleccionar reemplazo
        </span>

        <select
          value={replacementProfileId}
          onChange={(event) =>
            setReplacementProfileId(
              event.target.value
            )
          }
          disabled={loading !== null}
          className="mt-2 h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            Elige una persona
          </option>

          {replacements.map(
            (replacement) => (
              <option
                key={replacement.id}
                value={replacement.id}
              >
                {replacement.name}
                {replacement.position
                  ? ` · ${replacement.position}`
                  : ""}
              </option>
            )
          )}
        </select>
      </label>

      {replacements.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-stone-100 p-4 text-sm leading-6 text-stone-600">
          No hay integrantes disponibles para reemplazar esta asignación.
        </p>
      ) : null}

      <button
        type="button"
        disabled={
          loading !== null ||
          !replacementProfileId ||
          replacements.length === 0
        }
        onClick={replace}
        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "replace" ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <UserRoundPlus size={18} />
        )}

        {loading === "replace"
          ? "Asignando reemplazo..."
          : "Asignar reemplazo"}
      </button>

      <button
        type="button"
        disabled={loading !== null}
        onClick={returnToPending}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "pending" ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <RefreshCw size={18} />
        )}

        {loading === "pending"
          ? "Actualizando..."
          : "Regresar a pendiente"}
      </button>

      {message ? (
        <p className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm leading-6 text-stone-700">
          {message}
        </p>
      ) : null}
    </article>
  );
}