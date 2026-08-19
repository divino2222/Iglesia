"use client";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Mic2,
  NotebookText,
  Save,
} from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createServicePlanAction } from "./actions";

const initialState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={18} />

      {pending
        ? "Creando servicio..."
        : "Crear servicio y equipos"}
    </button>
  );
}

export default function ServicePlanForm() {
  const [state, formAction] = useActionState(
    createServicePlanAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <CalendarDays size={17} />
            Fecha
          </span>

          <input
            required
            type="date"
            name="service_date"
            className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
          />
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <Clock3 size={17} />
            Hora
          </span>

          <input
            required
            type="time"
            name="service_time"
            defaultValue="11:00"
            className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-700">
          Nombre del servicio
        </span>

        <input
          required
          type="text"
          name="title"
          defaultValue="Servicio dominical"
          placeholder="Servicio dominical"
          className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <MapPin size={17} />
          Lugar
        </span>

        <input
          type="text"
          name="location"
          defaultValue="Comunidad VID Iztapalapa"
          className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Mic2 size={17} />
          Predicador
        </span>

        <input
          type="text"
          name="preacher"
          defaultValue="Pastor José Luis Aguilar"
          placeholder="Nombre del predicador"
          className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-700">
          Tema
        </span>

        <input
          type="text"
          name="theme"
          placeholder="Tema del mensaje"
          className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-700">
          Versículo
        </span>

        <input
          type="text"
          name="verse"
          placeholder="Ej. Todo debe hacerse decentemente y con orden — 1 Corintios 14:40"
          className="h-13 w-full rounded-2xl border border-stone-200 bg-white px-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <NotebookText size={17} />
          Notas
        </span>

        <textarea
          name="notes"
          rows={4}
          placeholder="Indicaciones generales para todos los servidores."
          className="w-full resize-none rounded-2xl border border-stone-200 bg-white p-4 outline-none transition focus:border-stone-500"
        />
      </label>

      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <p className="font-semibold text-stone-950">
          Equipos que se crearán
        </p>

        <p className="mt-1 text-sm leading-6 text-stone-500">
          Alabanza, Multimedia, Ujieres, Niños,
          Cafetería y Ofrendas.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}