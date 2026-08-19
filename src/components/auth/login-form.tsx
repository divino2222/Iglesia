"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Props = {
  errorMessage?: string;
};

type DefaultRouteResponse = {
  route?: string;
  error?: string;
};

export function LoginForm({
  errorMessage,
}: Props) {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setLocalError("");

    try {
      const supabase =
        createClient();

      const {
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email
              .trim()
              .toLowerCase(),
            password,
          }
        );

      if (signInError) {
        setLocalError(
          signInError.message
        );
        return;
      }

      /*
       * La sesión ya quedó guardada en las cookies.
       * Ahora preguntamos al servidor cuál es la ruta
       * correspondiente al rol y permisos de la persona.
       */
      const response = await fetch(
        "/api/auth/default-route",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      const result =
        (await response.json()) as DefaultRouteResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "No se pudo determinar tu página de inicio."
        );
      }

      const destination =
        result.route ||
        "/mi-servicio";

      router.replace(destination);
      router.refresh();
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full rounded-[34px] border border-stone-200 bg-white p-7 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
        Comunidad VID
      </p>

      <h1 className="mt-2 text-4xl font-semibold text-stone-950">
        Iniciar sesión
      </h1>

      <p className="mt-2 text-sm leading-6 text-stone-600">
        Entra para acceder a las
        funciones disponibles para tu
        cuenta.
      </p>

      {errorMessage ||
      localError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {localError ||
            errorMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Correo
          </span>

          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            required
            disabled={loading}
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-stone-950 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-stone-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Contraseña
          </span>

          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            required
            disabled={loading}
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-stone-950 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-stone-100"
          />
        </label>

        <button
          type="submit"
          disabled={
            loading ||
            !email.trim() ||
            !password
          }
          className="w-full rounded-2xl bg-stone-950 px-4 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>
    </section>
  );
}