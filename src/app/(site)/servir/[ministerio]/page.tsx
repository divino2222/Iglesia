import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coffee,
  HandHeart,
  HeartHandshake,
  LogIn,
  Mic2,
  MonitorPlay,
  Sparkles,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

/* =========================================================
   TIPOS
========================================================= */

type Ministry = {
  name: string;
  emoji: string;
  description: string;
  longDescription: string;
  activities: string[];
  phrase: string;
  icon: React.ElementType;
};

/* =========================================================
   MINISTERIOS DISPONIBLES
========================================================= */

const ministries: Record<string, Ministry> = {
  alabanza: {
    name: "Alabanza",
    emoji: "🎤",
    description:
      "Voz, instrumentos y apoyo musical.",

    longDescription:
      "El equipo de Alabanza sirve a nuestra comunidad a través de la música y la adoración. Cada integrante aporta sus dones para ayudar a crear un ambiente donde juntos podamos acercarnos a Dios.",

    activities: [
      "Voz",
      "Guitarra",
      "Bajo",
      "Batería",
      "Teclado",
      "Apoyo musical",
    ],

    phrase:
      "No necesitas tener todo resuelto. Queremos conocerte y acompañarte en el proceso.",

    icon: Mic2,
  },

  cafeteria: {
    name: "Cafetería",
    emoji: "☕",
    description:
      "Hospitalidad, preparación y atención.",

    longDescription:
      "El equipo de Cafetería ayuda a crear un ambiente cercano y acogedor. Servimos recibiendo a las personas con atención, hospitalidad y una sonrisa.",

    activities: [
      "Preparación",
      "Atención",
      "Hospitalidad",
      "Organización",
      "Apoyo antes y después del servicio",
    ],

    phrase:
      "A veces servir comienza con algo tan sencillo como hacer sentir bienvenido a alguien.",

    icon: Coffee,
  },

  multimedia: {
    name: "Multimedia",
    emoji: "🎥",
    description:
      "Audio, video, transmisión y contenido.",

    longDescription:
      "El equipo de Multimedia ayuda a que cada mensaje pueda verse y escucharse claramente dentro y fuera de Comunidad VID.",

    activities: [
      "Audio",
      "Video",
      "Transmisión en vivo",
      "Presentaciones",
      "Fotografía",
      "Contenido digital",
    ],

    phrase:
      "La tecnología también puede convertirse en una herramienta para servir.",

    icon: MonitorPlay,
  },

  ninos: {
    name: "Niños",
    emoji: "🧒",
    description:
      "Cuidado, acompañamiento y apoyo.",

    longDescription:
      "El equipo de Niños acompaña a los más pequeños de nuestra comunidad en un ambiente seguro, cercano y preparado especialmente para ellos.",

    activities: [
      "Acompañamiento",
      "Apoyo en actividades",
      "Bienvenida",
      "Cuidado",
      "Organización",
    ],

    phrase:
      "Servir a una nueva generación también es sembrar para el futuro.",

    icon: Users,
  },

  ofrendas: {
    name: "Ofrendas",
    emoji: "🙌",
    description:
      "Apoyo durante momentos específicos del servicio.",

    longDescription:
      "El equipo de Ofrendas ayuda a cuidar este momento del servicio con orden, atención y responsabilidad.",

    activities: [
      "Organización",
      "Apoyo durante el servicio",
      "Orientación",
      "Atención",
    ],

    phrase:
      "Cada función, aunque parezca pequeña, ayuda a que todo funcione mejor.",

    icon: HandHeart,
  },

  ujieres: {
    name: "Ujieres",
    emoji: "🚪",
    description:
      "Bienvenida, orientación y atención.",

    longDescription:
      "Los ujieres son muchas veces el primer rostro que una persona encuentra al llegar. Su misión es recibir, orientar y ayudar a que todos se sientan en casa.",

    activities: [
      "Bienvenida",
      "Orientación",
      "Atención a visitantes",
      "Apoyo durante el servicio",
      "Organización",
    ],

    phrase:
      "Una buena bienvenida puede cambiar por completo la experiencia de una persona.",

    icon: HeartHandshake,
  },
};

/* =========================================================
   PROPS
========================================================= */

type PageProps = {
  params: Promise<{
    ministerio: string;
  }>;
};

/* =========================================================
   NORMALIZAR NOMBRE
========================================================= */

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX");
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function MinistryPage({
  params,
}: PageProps) {
  const { ministerio } = await params;

  const ministry =
    ministries[ministerio];

  if (!ministry) {
    notFound();
  }

  const Icon = ministry.icon;

  const supabase =
    await createClient();

  /* =======================================================
     USUARIO ACTUAL
  ======================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* =======================================================
     ESTADO PERSONAL DEL USUARIO
  ======================================================= */

  let isPending = false;
  let isApproved = false;

  if (user) {
    /*
     * PERFIL
     */

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        ministries,
        role,
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
        `No se pudo consultar tu perfil: ${profileError.message}`
      );
    }

    const profileMinistries =
      Array.isArray(
        profile?.ministries
      )
        ? profile.ministries
        : [];

    const belongsToMinistry =
      profileMinistries.some(
        (item) =>
          normalize(item) ===
          normalize(ministry.name)
      );

    /*
     * MINISTERIO REAL EN BASE DE DATOS
     */

    const {
      data: ministryRow,
      error: ministryError,
    } = await supabase
      .from("ministries")
      .select(`
        id,
        name
      `)
      .eq(
        "name",
        ministry.name
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();

    if (ministryError) {
      throw new Error(
        `No se pudo consultar el ministerio: ${ministryError.message}`
      );
    }

    /*
     * SOLICITUD
     */

    if (ministryRow) {
      const {
        data: request,
        error: requestError,
      } = await supabase
        .from("ministry_requests")
        .select(`
          id,
          status
        `)
        .eq(
          "auth_user_id",
          user.id
        )
        .eq(
          "ministry_id",
          ministryRow.id
        )
        .in("status", [
          "pending",
          "approved",
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

      isPending =
        request?.status ===
          "pending" &&
        !belongsToMinistry;

      isApproved =
        belongsToMinistry ||
        request?.status ===
          "approved";
    } else {
      /*
       * Aunque no pudiéramos resolver el registro
       * de ministries, el perfil sigue siendo la
       * fuente final de pertenencia.
       */

      isApproved =
        belongsToMinistry;
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* ===============================================
            VOLVER
        =============================================== */}

        <Link
          href="/servir"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft
            size={17}
          />

          Explorar equipos
        </Link>

        {/* ===============================================
            HERO
        =============================================== */}

        <section className="overflow-hidden rounded-[34px] bg-stone-950 text-white shadow-xl">
          <div className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {isApproved ? (
                <>
                  <CheckCircle2
                    size={13}
                  />

                  Mi ministerio
                </>
              ) : isPending ? (
                <>
                  <Clock3
                    size={13}
                  />

                  En revisión
                </>
              ) : (
                <>
                  <Sparkles
                    size={13}
                  />

                  Quiero servir
                </>
              )}
            </div>

            <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/10">
              <Icon
                size={28}
              />
            </div>

            <p className="mt-5 text-4xl">
              {ministry.emoji}
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {ministry.name}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {ministry.description}
            </p>
          </div>
        </section>

        {/* ===============================================
            ESTADO: YA PERTENECE
        =============================================== */}

        {isApproved ? (
          <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2
                  size={22}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Ya eres parte del equipo
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  Formas parte de{" "}
                  {ministry.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Tu solicitud fue aprobada
                  por Coordinación. Cuando
                  seas asignado a un servicio,
                  podrás revisar tu
                  participación desde Mi
                  servicio.
                </p>
              </div>
            </div>

            <Link
              href="/mi-servicio"
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-5 text-sm font-semibold text-white"
            >
              Ir a Mi servicio

              <ArrowRight
                size={18}
              />
            </Link>
          </section>
        ) : null}

        {/* ===============================================
            ESTADO: PENDIENTE
        =============================================== */}

        {isPending ? (
          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
                <Clock3
                  size={22}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Solicitud en revisión
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-950">
                  Ya recibimos tu interés
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Coordinación está revisando
                  tu solicitud para servir en{" "}
                  {ministry.name}. No necesitas
                  enviar otra.
                </p>
              </div>
            </div>

            <Link
              href={`/servir/solicitud?ministerio=${ministerio}`}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-amber-600 px-5 text-sm font-semibold text-white"
            >
              Ver mi solicitud

              <ArrowRight
                size={18}
              />
            </Link>
          </section>
        ) : null}

        {/* ===============================================
            SOBRE EL EQUIPO
        =============================================== */}

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Sobre este equipo
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            ¿Qué hacemos?
          </h2>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            {
              ministry.longDescription
            }
          </p>
        </section>

        {/* ===============================================
            FORMAS DE PARTICIPAR
        =============================================== */}

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Puedes participar
          </p>

          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Hay distintas formas de ayudar
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {ministry.activities.map(
              (activity) => (
                <span
                  key={activity}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                >
                  {activity}
                </span>
              )
            )}
          </div>
        </section>

        {/* ===============================================
            MENSAJE
            Solo tiene sentido si todavía NO pertenece
        =============================================== */}

        {!isApproved &&
        !isPending ? (
          <section className="rounded-[30px] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Da el primer paso
            </p>

            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              ¿Te gustaría formar
              parte?
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-600">
              {ministry.phrase}
            </p>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              Envíanos tu interés y
              podremos conocerte mejor
              antes de integrarte al
              equipo.
            </p>
          </section>
        ) : null}

        {/* ===============================================
            CTA PARA USUARIO AUTENTICADO
            SIN SOLICITUD
        =============================================== */}

        {user &&
        !isApproved &&
        !isPending ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <Link
              href={`/servir/solicitud?ministerio=${ministerio}`}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-5 text-sm font-semibold text-white"
            >
              Me gustaría servir aquí

              <ArrowRight
                size={18}
              />
            </Link>

            <p className="mt-3 text-center text-xs leading-5 text-stone-500">
              Cuéntanos brevemente por qué
              te gustaría formar parte de
              este equipo.
            </p>
          </section>
        ) : null}

        {/* ===============================================
            CTA PARA VISITANTE SIN CUENTA
        =============================================== */}

        {!user ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <Link
              href={`/registro?ministerio=${ministerio}`}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-5 text-sm font-semibold text-white"
            >
              Me gustaría servir aquí

              <ArrowRight
                size={18}
              />
            </Link>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />

              <span className="text-xs text-stone-400">
                o
              </span>

              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="text-center">
              <p className="text-sm text-stone-500">
                ¿Ya tienes una cuenta?
              </p>

              <Link
                href={`/login?next=${encodeURIComponent(
                  `/servir/${ministerio}`
                )}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-950"
              >
                <LogIn
                  size={16}
                />

                Iniciar sesión
              </Link>
            </div>
          </section>
        ) : null}

        {/* ===============================================
            VOLVER
        =============================================== */}

        <Link
          href="/servir"
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-stone-700"
        >
          Ver otros equipos
        </Link>
      </div>
    </main>
  );
}