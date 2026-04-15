"use client";

import { useState } from "react";
import { Mail, Phone, UserRound, FileText, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WHATSAPP_NUMBER = "525520035631";

export default function ContactForm() {
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

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

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Nombre, correo y mensaje son obligatorios.");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    };

    const { error } = await supabase.from("contact_messages").insert([payload]);

    if (error) {
      setError("No se pudo enviar tu mensaje. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const whatsappText = encodeURIComponent(
      `Nuevo mensaje de contacto:%0A%0A` +
        `Nombre: ${payload.name}%0A` +
        `Correo: ${payload.email}%0A` +
        `Teléfono: ${payload.phone || "No proporcionado"}%0A` +
        `Asunto: ${payload.subject || "Sin asunto"}%0A` +
        `Mensaje: ${payload.message}`
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`,
      "_blank"
    );

    setSuccess("Tu mensaje fue enviado correctamente.");
    setForm({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-stone-900">Envíanos un mensaje</h2>
        <p className="mt-1 text-sm text-stone-500">
          Completa el formulario y nos pondremos en contacto contigo.
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
            htmlFor="phone"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <Phone size={16} className="text-stone-400" />
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            placeholder="Tu teléfono"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="subject"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <FileText size={16} className="text-stone-400" />
            Asunto
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={form.subject}
            onChange={handleChange}
            placeholder="Asunto del mensaje"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700"
          >
            <MessageSquare size={16} className="text-stone-400" />
            Mensaje
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Escribe tu mensaje"
            rows={5}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:bg-white"
          />
        </div>

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
          {loading ? "Enviando..." : "Enviar mensaje"}
        </button>
      </div>
    </form>
  );
}