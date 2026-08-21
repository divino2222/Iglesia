"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const redirectUrl = `${window.location.origin}/auth/callback?next=/mi-cuenta`;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,

        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={30} />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-stone-950">
          Revisa tu correo
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Te enviamos un mensaje para confirmar tu cuenta de Comunidad VID.
          Después de confirmar podrás iniciar sesión.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-[20px] bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Nombre
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <UserRound size={18} className="text-stone-400" />

          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Tu nombre"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Correo electrónico
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <Mail size={18} className="text-stone-400" />

          <input
            required
            type="email"
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
            required
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-stone-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Confirmar contraseña
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <LockKeyhole size={18} className="text-stone-400" />

          <input
            required
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />
        </div>
      </label>

      {errorMessage ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[22px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Creando cuenta..." : "Crear mi cuenta"}
      </button>

      <p className="text-center text-sm text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-stone-950 underline underline-offset-4"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}