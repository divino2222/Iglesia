"use client";

import { useState } from "react";
import { uploadPublicImage } from "@/lib/supabase/storage";

export default function ImageUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setError("Selecciona una imagen.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setUrl("");

      const result = await uploadPublicImage(file, "home");

      setUrl(result.publicUrl);
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Subiendo..." : "Subir imagen"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {url ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600">Imagen subida correctamente.</p>
          <p className="break-all text-xs text-zinc-600">{url}</p>
        </div>
      ) : null}
    </form>
  );
}