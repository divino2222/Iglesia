"use client";

import { useState } from "react";

export default function SendAutoPrayerButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleClick = async () => {
    try {
      setLoading(true);
      setResult("");

      const res = await fetch("/api/push/auto-prayer-reminder");
      const data = await res.json();

      if (data.ok && !data.skipped) {
        setResult(
          `Enviadas: ${data.sent}, fallidas: ${data.failed}, dirige: ${
            data.leader || "N/D"
          }`
        );
      } else {
        setResult(data.reason || "No se envió nada.");
      }
    } catch {
      setResult("Error al ejecutar recordatorio automático.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Probar recordatorio automático"}
      </button>

      {result ? <p className="text-sm text-stone-600">{result}</p> : null}
    </div>
  );
}