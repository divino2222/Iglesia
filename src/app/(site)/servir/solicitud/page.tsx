import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryRequestAutoRefresh from "@/components/ministry/ministry-request-auto-refresh";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import {
  createMinistryRequestAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    ministerio?: string;
    enviada?: string;
  }>;
};

const ministryNames: Record<
  string,
  string
> = {
  alabanza: "Alabanza",
  cafeteria: "Cafetería",
  multimedia: "Multimedia",
  ninos: "Niños",
  ofrendas: "Ofrendas",
  ujieres: "Ujieres",
};

export default async function MinistryRequestPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  /* =====================================================
     MINISTERIO SOLICITADO
  ===================================================== */

  const ministrySlug =
    params?.ministerio
      ?.trim()
      .toLowerCase();

  if (
    !ministrySlug ||
    !ministryNames[
      ministrySlug
    ]
  ) {
    redirect("/servir");
  }

  const ministryName =
    ministryNames[
      ministrySlug
    ];

  const supabase =
    await createClient();

  /* =====================================================
     USUARIO
  ===================================================== */

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    const next =
      `/servir/solicitud?ministerio=${encodeURIComponent(
        ministrySlug
      )}`;

    redirect(
      `/login?next=${encodeURIComponent(
        next
      )}`
    );
  }

  /* =====================================================
     MINISTERIO
  ===================================================== */

  const {
    data: ministry,
    error: ministryError,
  } = await supabase
    .from("ministries")
    .select(`
      id,
      name,
      emoji
    `)
    .eq(
      "name",
      ministryName
    )
    .eq(
      "is_active",
      true
    )
    .maybeSingle();

  if (ministryError) {
    throw new Error(
      `No se pudo cargar el ministerio: ${ministryError.message}`
    );
  }

  if (!ministry) {
    redirect("/servir");
  }

  /* =====================================================
     PERFIL

     Nos sirve también como respaldo para confirmar
     que ya pertenece al ministerio aunque no exista
     una solicitud histórica disponible.
  ===================================================== */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      ministries,
      is_active,
      auth_user_id
    `)
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo cargar tu perfil: ${profileError.message}`
    );
  }

  /* =====================================================
     ÚLTIMA SOLICITUD

     Incluimos:
     - pending
     - approved
     - rejected

     Y elegimos siempre la más reciente.
  ===================================================== */

  const {
    data: existingRequest,
    error: requestError,
  } = await supabase
    .from(
      "ministry_requests"
    )
    .select(`
      id,
      status,
      message,
      created_at,
      reviewed_at
    `)
    .eq(
      "auth_user_id",
      user.id
    )
    .eq(
      "ministry_id",
      ministry.id
    )
    .in("status", [
      "pending",
      "approved",
      "rejected",
    ])
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (requestError) {
    throw new Error(
      `No se pudo consultar tu solicitud: ${requestError.message}`
    );
  }

  /* =====================================================
     ESTADOS
  ===================================================== */

  const sent =
    params?.enviada === "1";

  const isPending =
    existingRequest?.status ===
    "pending";

  const requestApproved =
    existingRequest?.status ===
    "approved";

  const isRejected =
    existingRequest?.status ===
    "rejected";

  /* =====================================================
     MINISTERIOS DEL PERFIL
  ===================================================== */

  const profileMinistries =
    Array.isArray(
      profile?.ministries
    )
      ? profile.ministries
      : [];

  const belongsToMinistry =
    profileMinistries.some(
      (item) =>
        item
          .trim()
          .toLowerCase() ===
        ministryName
          .trim()
          .toLowerCase()
    );

  /*
   * Consideramos aprobado si:
   *
   * 1. La solicitud está approved
   * o
   * 2. profiles.ministries ya contiene el ministerio.
   */

  const isApproved =
    requestApproved ||
    belongsToMinistry;

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 pb-28">
      {/* =================================================
          AUTO REFRESH

          Solo corre mientras la solicitud esté pendiente.
          En cuanto pasa a approved o rejected se detiene.
      ================================================= */}

      <MinistryRequestAutoRefresh
        enabled={isPending}
      />

      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* =================================================
            VOLVER
        ================================================= */}

        <Link
          href={`/servir/${ministrySlug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft
            size={17}
          />

          Volver a{" "}
          {ministryName}
        </Link>

        {/* =================================================
            CABECERA
        ================================================= */}

        <section className="overflow-hidden rounded-[34px] bg-stone-950 text-white shadow-xl">
          <div className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              <HeartHandshake
                size={13}
              />

              {isApproved
                ? "Mi ministerio"
                : isPending
                  ? "En revisión"
                  : isRejected
                    ? "Solicitud revisada"
                    : "Quiero servir"}
            </div>

            <p className="mt-5 text-4xl">
              {ministry.emoji ||
                "🙌"}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {isApproved
                ? ministryName
                : `Solicitud para ${ministryName}`}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {isApproved
                ? `Ya formas parte del equipo de ${ministryName} en Comunidad VID.`
                : isPending
                  ? "Tu solicitud está siendo revisada por Coordinación."
                  : isRejected
                    ? "Gracias por tu disposición para servir en Comunidad VID."
                    : "Gracias por dar este paso. Queremos conocerte un poco mejor antes de integrarte al equipo."}
            </p>
          </div>
        </section>

        {/* =================================================
            APROBADA
        ================================================= */}

        {isApproved ? (
          <>
            <section className="overflow-hidden rounded-[30px] border border-emerald-200 bg-emerald-50 shadow-sm">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <CheckCircle2
                      size={22}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Solicitud aprobada
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-stone-950">
                      Ya formas parte de{" "}
                      {ministryName}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Coordinación aprobó tu
                      solicitud y ya estás
                      registrado como parte
                      de este ministerio.
                    </p>
                  </div>
                </div>

                {/* QUÉ SIGUE */}

                <div className="mt-5 rounded-[22px] bg-white p-4">
                  <div className="flex gap-3">
                    <Sparkles
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        ¿Qué sigue?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        Cuando Coordinación
                        te asigne a un
                        servicio, podrás ver
                        la fecha, tu equipo
                        y confirmar tu
                        participación desde
                        Mi servicio.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/mi-servicio"
                  className="mt-5 flex h-14 w-full items-center justify-center rounded-[22px] bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Ir a Mi servicio
                </Link>
              </div>
            </section>

            {/* MENSAJE ORIGINAL */}

            {existingRequest?.message ? (
              <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Lo que nos
                  compartiste
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {
                    existingRequest.message
                  }
                </p>
              </section>
            ) : null}
          </>
        ) : isPending ? (
          /* =================================================
              PENDIENTE
          ================================================= */

          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Clock3
                size={22}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="font-semibold text-amber-800">
                  Tu solicitud está en
                  revisión
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Coordinación recibió
                  tu interés en servir
                  en{" "}
                  {ministryName}.
                  Cuando haya una
                  respuesta podrás
                  verla aquí.
                </p>

                {existingRequest?.message ? (
                  <div className="mt-4 rounded-[20px] bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                      Lo que nos
                      compartiste
                    </p>

                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      {
                        existingRequest.message
                      }
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : isRejected ? (
          /* =================================================
              NO APROBADA
          ================================================= */

          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
                <HeartHandshake
                  size={22}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Solicitud revisada
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  En esta ocasión no fue
                  posible integrarte a{" "}
                  {ministryName}
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Gracias por tu
                  disposición para servir.
                  Puedes conocer otros
                  equipos de Comunidad VID
                  y descubrir dónde podrías
                  participar.
                </p>
              </div>
            </div>

            {/* MENSAJE ORIGINAL */}

            {existingRequest?.message ? (
              <div className="mt-5 rounded-[20px] bg-stone-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Lo que nos
                  compartiste
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {
                    existingRequest.message
                  }
                </p>
              </div>
            ) : null}

            {/* ACCIONES */}

            <div className="mt-5 space-y-3">
              <Link
                href="/servir"
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white"
              >
                Explorar otros equipos
              </Link>

              <Link
                href={`/servir/${ministrySlug}`}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700"
              >
                Volver a{" "}
                {ministryName}
              </Link>
            </div>

            {/* NUEVA SOLICITUD FUTURA */}

            <div className="mt-5 border-t border-stone-100 pt-5">
              <div className="flex items-start gap-3">
                <RotateCcw
                  size={17}
                  className="mt-0.5 shrink-0 text-stone-400"
                />

                <p className="text-xs leading-5 text-stone-500">
                  Si más adelante deseas
                  volver a expresar tu
                  interés por este
                  ministerio, podrás
                  enviar una nueva
                  solicitud.
                </p>
              </div>
            </div>
          </section>
        ) : (
          /* =================================================
              NUEVA SOLICITUD
          ================================================= */

          <>
            {sent ? (
              <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-3 text-emerald-700">
                  <CheckCircle2
                    size={20}
                  />

                  <p className="text-sm font-semibold">
                    Tu solicitud fue
                    enviada
                    correctamente.
                  </p>
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Cuéntanos de ti
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                ¿Por qué te gustaría
                servir aquí?
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                No necesitas escribir
                algo perfecto. Sólo
                queremos conocer tu
                motivación y cómo te
                gustaría participar.
              </p>

              <form
                action={async (
                  formData
                ) => {
                  "use server";

                  await createMinistryRequestAction(
                    {
                      ministrySlug,

                      message:
                        String(
                          formData.get(
                            "message"
                          ) ?? ""
                        ),
                    }
                  );
                }}
                className="mt-5 space-y-4"
              >
                <textarea
                  name="message"
                  required
                  minLength={10}
                  rows={6}
                  placeholder="Por ejemplo: Me gustaría servir porque..."
                  className="w-full rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                />

                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Send
                    size={18}
                  />

                  Enviar solicitud
                </button>
              </form>
            </section>
          </>
        )}

        {/* =================================================
            OTROS EQUIPOS
        ================================================= */}

        {!isRejected ? (
          <Link
            href="/servir"
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-stone-700"
          >
            Ver otros equipos
          </Link>
        ) : null}
      </div>
    </main>
  );
}