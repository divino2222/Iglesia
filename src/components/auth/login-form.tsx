"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);

      if (error.message.toLowerCase().includes("invalid login")) {
        setErrorMessage("Correo o contraseña incorrectos.");
        return;
      }

      if (error.message.toLowerCase().includes("email not confirmed")) {
        setErrorMessage(
          "Primero confirma tu correo electrónico para poder ingresar."
        );
        return;
      }

      setErrorMessage(error.message);
      return;
    }

    router.replace("/mi-cuenta");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Correo electrónico
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <Mail size={18} className="text-stone-400" />

          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Contraseña
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <LockKeyhole size={18} className="text-stone-400" />

          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-stone-400"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {errorMessage ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(0,0,0,0.15)] transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn size={18} />

        {loading ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <div className="text-center">
        <p className="text-sm text-stone-600">
          ¿Todavía no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-stone-950 underline underline-offset-4"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  );
}