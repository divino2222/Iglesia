"use client";

import { useState } from "react";

export default function SendPrayerPushButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleSend = async () => {
    try {
      setLoading(true);
      setResult("");

      const res = await fetch("/api/push/send-prayer-leader", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.ok) {
        setResult(`Push enviada. Enviadas: ${data.sent}, fallidas: ${data.failed}`);
      } else {
        setResult(data?.error || data?.message || "No se pudo enviar.");
      }
    } catch {
      setResult("Error al enviar push.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar push de oración"}
      </button>

      {result ? (
        <p className="text-sm text-stone-600">{result}</p>
      ) : null}
    </div>
  );
}