import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  approveMinistryRequest,
  rejectMinistryRequest,
} from "./actions";

import { requireAnyPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MinistryRequestRow = {
  id: string;
  auth_user_id: string;
  ministry_id: string;
  status: string;
  message: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: string;
  ministries: string[] | null;
  is_active: boolean;
};

type MinistryRow = {
  id: string;
  name: string;
  emoji: string | null;
};

/* =========================================================
   FECHA
========================================================= */

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(date));
}

/* =========================================================
   INICIALES
========================================================= */

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
}

/* =========================================================
   ESTADO
========================================================= */

function getStatusLabel(
  status: string
) {
  if (status === "approved") {
    return "Aprobada";
  }

  if (status === "rejected") {
    return "No aprobada";
  }

  return "Pendiente";
}

function getStatusClasses(
  status: string
) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function MinistryRequestDetailPage({
  params,
}: PageProps) {
  /* =======================================================
     PERMISOS
  ======================================================= */

  await requireAnyPermission(
    [
      "dashboard.view",
      "services.view_all",
      "services.create",
      "teams.view_all",
      "teams.manage",
    ],
    {
      redirectTo: "/sin-acceso",
    }
  );

  const { id } = await params;

  const admin = createAdminClient();

  /* =======================================================
     SOLICITUD
  ======================================================= */

  const {
    data: requestData,
    error: requestError,
  } = await admin
    .from("ministry_requests")
    .select(`
      id,
      auth_user_id,
      ministry_id,
      status,
      message,
      admin_notes,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (requestError) {
    throw new Error(
      `No se pudo consultar la solicitud: ${requestError.message}`
    );
  }

  if (!requestData) {
    notFound();
  }

  const request =
    requestData as MinistryRequestRow;

  /* =======================================================
     PERSONA + MINISTERIO
  ======================================================= */

  const [
    profileResult,
    ministryResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        auth_user_id,
        full_name,
        email,
        phone,
        photo_url,
        role,
        ministries,
        is_active
      `)
      .eq(
        "auth_user_id",
        request.auth_user_id
      )
      .maybeSingle(),

    admin
      .from("ministries")
      .select(`
        id,
        name,
        emoji
      `)
      .eq(
        "id",
        request.ministry_id
      )
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw new Error(
      `No se pudo consultar la persona: ${profileResult.error.message}`
    );
  }

  if (ministryResult.error) {
    throw new Error(
      `No se pudo consultar el ministerio: ${ministryResult.error.message}`
    );
  }

  const profile =
    profileResult.data as
      | ProfileRow
      | null;

  const ministry =
    ministryResult.data as
      | MinistryRow
      | null;

  if (!profile || !ministry) {
    notFound();
  }

  const isPending =
    request.status === "pending";

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* =================================================
            VOLVER
        ================================================= */}

        <Link
          href="/coordinacion/servir/solicitudes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} />
          Solicitudes
        </Link>

        {/* =================================================
            CABECERA
        ================================================= */}

        <header className="overflow-hidden rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Solicitud para servir
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {ministry.emoji
                  ? `${ministry.emoji} `
                  : ""}
                {ministry.name}
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/65">
                Revisa la información antes de tomar una
                decisión.
              </p>
            </div>

            <div
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusClasses(
                request.status
              )}`}
            >
              {getStatusLabel(
                request.status
              )}
            </div>
          </div>
        </header>

        {/* =================================================
            PERSONA
        ================================================= */}

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Persona
          </p>

          <div className="mt-4 flex items-start gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="h-16 w-16 shrink-0 rounded-[22px] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-stone-950 text-lg font-bold text-white">
                {getInitials(
                  profile.full_name
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-stone-950">
                {profile.full_name}
              </h2>

              <p className="mt-1 text-sm font-medium text-stone-500">
                {ministry.emoji
                  ? `${ministry.emoji} `
                  : ""}
                Quiere servir en{" "}
                {ministry.name}
              </p>
            </div>
          </div>

          {/* DATOS */}

          <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
            {profile.email ? (
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Mail
                  size={17}
                  className="shrink-0 text-stone-400"
                />

                <span className="break-all">
                  {profile.email}
                </span>
              </div>
            ) : null}

            {profile.phone ? (
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Phone
                  size={17}
                  className="shrink-0 text-stone-400"
                />

                <span>
                  {profile.phone}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-3 text-sm text-stone-600">
              <UserRound
                size={17}
                className="shrink-0 text-stone-400"
              />

              <span>
                Perfil: {profile.role}
              </span>
            </div>
          </div>

          {/* MINISTERIOS ACTUALES */}

          {profile.ministries &&
          profile.ministries.length > 0 ? (
            <div className="mt-5 border-t border-stone-100 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                Ministerios actuales
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.ministries.map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* =================================================
            MENSAJE
        ================================================= */}

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
              <MessageSquareText
                size={19}
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                Nos compartió
              </p>

              <p className="mt-1 text-sm font-semibold text-stone-950">
                Su interés por servir
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] bg-stone-50 px-4 py-4">
            <p className="text-sm leading-6 text-stone-700">
              {request.message ||
                "No agregó un mensaje."}
            </p>
          </div>
        </section>

        {/* =================================================
            FECHA
        ================================================= */}

        <section className="rounded-[26px] border border-stone-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CalendarDays
              size={18}
              className="mt-0.5 shrink-0 text-stone-400"
            />

            <div>
              <p className="text-xs font-semibold text-stone-700">
                Solicitud recibida
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                {formatDate(
                  request.created_at
                )}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            PENDIENTE: DECISIÓN
        ================================================= */}

        {isPending ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Revisión de Coordinación
            </p>

            <h2 className="mt-1 text-xl font-semibold text-stone-950">
              Tomar una decisión
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Puedes agregar una nota interna antes de aprobar
              o no aprobar esta solicitud.
            </p>

            {/* =============================================
                APROBAR
            ============================================= */}

            <form
              action={
                approveMinistryRequest
              }
              className="mt-5"
            >
              <input
                type="hidden"
                name="request_id"
                value={request.id}
              />

              <label
                htmlFor="approve_notes"
                className="text-xs font-semibold text-stone-700"
              >
                Nota de Coordinación
              </label>

              <textarea
                id="approve_notes"
                name="admin_notes"
                rows={4}
                placeholder="Ej. Contactar para conocerle y explicarle el proceso del equipo."
                className="mt-2 w-full resize-none rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
              />

              <button
                type="submit"
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2
                  size={19}
                />
                Aprobar solicitud
              </button>
            </form>

            {/* DIVISOR */}

            <div className="my-5 border-t border-stone-100" />

            {/* =============================================
                NO APROBAR
            ============================================= */}

            <form
              action={
                rejectMinistryRequest
              }
            >
              <input
                type="hidden"
                name="request_id"
                value={request.id}
              />

              <label
                htmlFor="reject_notes"
                className="text-xs font-semibold text-stone-700"
              >
                Motivo o nota interna
              </label>

              <textarea
                id="reject_notes"
                name="admin_notes"
                rows={3}
                placeholder="Opcional. Esta nota será para seguimiento interno."
                className="mt-2 w-full resize-none rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
              />

              <button
                type="submit"
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <XCircle size={19} />
                No aprobar
              </button>
            </form>
          </section>
        ) : (
          /* ===============================================
             YA REVISADA
          =============================================== */

          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              {request.status ===
              "approved" ? (
                <CheckCircle2
                  size={22}
                  className="shrink-0 text-emerald-600"
                />
              ) : (
                <XCircle
                  size={22}
                  className="shrink-0 text-red-600"
                />
              )}

              <div>
                <h2 className="text-lg font-semibold text-stone-950">
                  {request.status ===
                  "approved"
                    ? "Solicitud aprobada"
                    : "Solicitud no aprobada"}
                </h2>

                {request.reviewed_at ? (
                  <p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                    <Clock3 size={14} />

                    {formatDate(
                      request.reviewed_at
                    )}
                  </p>
                ) : null}
              </div>
            </div>

            {request.admin_notes ? (
              <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                  Nota de Coordinación
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {request.admin_notes}
                </p>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}