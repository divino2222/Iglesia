"use client";

import { useState } from "react";
import { UserRound, Mail, MessageSquare, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WHATSAPP_NUMBER = "525520035631";

export default function PrayerRequestForm() {
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    is_private: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!form.name.trim() || !form.message.trim()) {
      setError("Nombre y petición son obligatorios.");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      message: form.message.trim(),
      is_private: form.is_private,
    };

    const { error } = await supabase.from("prayer_requests").insert([payload]);

    if (error) {
      setError("No se pudo enviar tu petición. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const whatsappText = encodeURIComponent(
      `Nueva petición de oración:%0A%0A` +
        `Nombre: ${payload.name}%0A` +
        `Correo: ${payload.email || "No proporcionado"}%0A` +
        `Privada: ${payload.is_private ? "Sí" : "No"}%0A` +
        `Petición: ${payload.message}`
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`,
      "_blank"
    );

    setSuccess("Tu petición fue enviada correctamente.");
    setForm({
      name: "",
      email: "",
      message: "",
      is_private: false,
    });
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-stone-900">
          Comparte tu petición
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Escríbenos con confianza. Estamos para acompañarte.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <UserRound size={16} className="text-stone-400" />
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <Mail size={16} className="text-stone-400" />
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tucorreo@ejemplo.com"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <MessageSquare size={16} className="text-stone-400" />
            Petición
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Escribe tu petición de oración"
            rows={5}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_private"
            checked={form.is_private}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4"
          />
          <span className="flex items-center gap-2">
            <Lock size={15} className="text-stone-400" />
            Quiero que esta petición sea privada
          </span>
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar petición"}
        </button>
      </div>
    </form>
  );
}