"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

/* =========================================================
   PROPS
========================================================= */

type LoginFormProps = {
  next?: string | null;
};

/* =========================================================
   VALIDAR DESTINO INTERNO

   Evita aceptar destinos externos.
   Devuelve null si no hay destino: se usará
   la ruta inicial del rol.
========================================================= */

function getSafeNextPath(
  next?: string | null
) {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//")
  ) {
    return null;
  }

  return next;
}

/* =========================================================
   RUTA INICIAL SEGÚN ROL

   Si falla, /mi-cuenta funciona para cualquier
   sesión activa.
========================================================= */

async function fetchDefaultRoute() {
  try {
    const response =
      await fetch(
        "/api/auth/default-route",
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return "/mi-cuenta";
    }

    const data =
      (await response.json()) as {
        route?: string;
      };

    return (
      getSafeNextPath(
        data.route
      ) ?? "/mi-cuenta"
    );
  } catch {
    return "/mi-cuenta";
  }
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function LoginForm({
  next = null,
}: LoginFormProps) {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const nextPath =
    getSafeNextPath(next);

  /*
   * Si desde el login la persona decide
   * crear una cuenta, conservamos también
   * el destino.
   */
  const registerHref =
    nextPath
      ? `/registro?next=${encodeURIComponent(
          nextPath
        )}`
      : "/registro";

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth.signInWithPassword({
          email:
            email
              .trim()
              .toLowerCase(),

          password,
        });

      if (error) {
        const message =
          error.message.toLowerCase();

        if (
          message.includes(
            "invalid login"
          )
        ) {
          setErrorMessage(
            "Correo o contraseña incorrectos."
          );

          return;
        }

        if (
          message.includes(
            "email not confirmed"
          )
        ) {
          setErrorMessage(
            "Primero confirma tu correo electrónico para poder ingresar."
          );

          return;
        }

        setErrorMessage(
          error.message
        );

        return;
      }

      /* ===================================================
         IMPORTANTE

         Ya no enviamos siempre a /mi-cuenta.

         Si llegó desde:
         /servir/alabanza

         podremos tener:
         /login?next=/servir/solicitud?ministerio=alabanza

         y regresará ahí.

         Sin destino, va a la ruta inicial de su rol.
      =================================================== */

      router.replace(
        nextPath ??
          (await fetchDefaultRoute())
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setErrorMessage(
        "No fue posible iniciar sesión. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-4"
    >
      {/* CORREO */}

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Correo electrónico
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <Mail
            size={18}
            className="text-stone-400"
          />

          <input
            type="email"
            required
            autoComplete="email"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="tu@correo.com"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />
        </div>
      </label>

      {/* CONTRASEÑA */}

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Contraseña
        </span>

        <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4">
          <LockKeyhole
            size={18}
            className="text-stone-400"
          />

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            required
            autoComplete="current-password"
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Tu contraseña"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-950 outline-none"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (
                  value
                ) =>
                  !value
              )
            }
            className="text-stone-400"
            aria-label={
              showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <EyeOff
                size={18}
              />
            ) : (
              <Eye
                size={18}
              />
            )}
          </button>
        </div>
      </label>

      {/* ERROR */}

      {errorMessage ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
          {
            errorMessage
          }
        </div>
      ) : null}

      {/* BOTÓN */}

      <button
        type="submit"
        disabled={
          loading
        }
        className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(0,0,0,0.15)] transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn
          size={18}
        />

        {loading
          ? "Ingresando..."
          : "Iniciar sesión"}
      </button>

      {/* CREAR CUENTA */}

      <div className="text-center">
        <p className="text-sm text-stone-600">
          ¿Todavía no tienes cuenta?{" "}

          <Link
            href={
              registerHref
            }
            className="font-semibold text-stone-950 underline underline-offset-4"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  );
}