import Link from "next/link";

import {
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

import ServingDashboard from "@/components/serving/serving-dashboard";
import { createClient } from "@/lib/supabase/server";

const ministries = [
  {
    name: "Alabanza",
    description:
      "Voz, instrumentos y apoyo para crear juntos un ambiente de adoración.",
    icon: Mic2,
    slug: "alabanza",
  },
  {
    name: "Cafetería",
    description:
      "Hospitalidad, preparación y atención para recibir a todos con calidez.",
    icon: Coffee,
    slug: "cafeteria",
  },
  {
    name: "Multimedia",
    description:
      "Audio, video, transmisión y contenido para llevar el mensaje más lejos.",
    icon: MonitorPlay,
    slug: "multimedia",
  },
  {
    name: "Niños",
    description:
      "Acompañamiento, cuidado y apoyo para servir a los más pequeños.",
    icon: Users,
    slug: "ninos",
  },
  {
    name: "Ofrendas",
    description:
      "Apoyo durante el servicio para cuidar este momento con orden y respeto.",
    icon: HandHeart,
    slug: "ofrendas",
  },
  {
    name: "Ujieres",
    description:
      "Bienvenida, orientación y atención para que cada persona se sienta en casa.",
    icon: HeartHandshake,
    slug: "ujieres",
  },
];

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX");
}

export default async function ServirPage() {
  const supabase =
    await createClient();

  /* =======================================================
     USUARIO
  ======================================================= */

  const {
  data: { user },
} = await supabase.auth.getUser();

  /* =======================================================
     PERFIL
  ======================================================= */

  let profile:
    | {
        id: string;
        role: string;
        ministries: string[] | null;
        is_active: boolean;
      }
    | null = null;

  if (user) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        ministries,
        is_active
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

    profile = profileData;
  }

  /* =======================================================
     ¿YA ES SERVIDOR?
  ======================================================= */

  const profileMinistries =
    Array.isArray(
      profile?.ministries
    )
      ? profile.ministries
      : [];

  const hasMinistry =
    profileMinistries.length > 0;

  const serverRoles = [
    "server",
    "servidor",
    "ministry_leader",
    "coordinator",
    "admin",
    "pastor",
  ];

  const hasServerRole =
    profile?.role
      ? serverRoles.includes(
          normalize(profile.role)
        )
      : false;

  /*
   * Mostrar Plan de servidores únicamente
   * a quien realmente ya pertenece al
   * sistema de servicio.
   */
  const shouldShowServingDashboard =
    Boolean(user) &&
    profile?.is_active === true &&
    (hasMinistry ||
      hasServerRole);

  if (shouldShowServingDashboard) {
    return (
      <div className="px-4 py-6">
        <ServingDashboard />
      </div>
    );
  }

  /* =======================================================
     SOLICITUDES PENDIENTES DEL USUARIO
  ======================================================= */

  const pendingMinistryNames =
    new Set<string>();

  if (user) {
    const {
      data: requests,
      error: requestsError,
    } = await supabase
      .from("ministry_requests")
      .select(`
        ministry_id,
        status,
        ministries (
          name
        )
      `)
      .eq(
        "auth_user_id",
        user.id
      )
      .eq(
        "status",
        "pending"
      );

    if (requestsError) {
      throw new Error(
        `No se pudieron consultar tus solicitudes: ${requestsError.message}`
      );
    }

    for (const request of
      requests ?? []) {
      const relatedMinistry =
        Array.isArray(
          request.ministries
        )
          ? request.ministries[0]
          : request.ministries;

      if (
        relatedMinistry &&
        typeof relatedMinistry ===
          "object" &&
        "name" in
          relatedMinistry &&
        typeof relatedMinistry.name ===
          "string"
      ) {
        pendingMinistryNames.add(
          normalize(
            relatedMinistry.name
          )
        );
      }
    }
  }

  /* =======================================================
     EXPLORAR MINISTERIOS
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="overflow-hidden rounded-[34px] bg-stone-950 text-white shadow-xl">
          <div className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              <Sparkles
                size={13}
              />

              Comunidad VID
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight">
              Hay un lugar para ti
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Servir es una oportunidad
              para usar lo que Dios ha
              puesto en ti y bendecir a
              otros. Conoce nuestros
              equipos y encuentra dónde
              puedes participar.
            </p>

            <div className="mt-6 rounded-[24px] bg-white/10 p-4">
              <p className="text-sm font-semibold">
                No necesitas saber
                exactamente dónde
                comenzar.
              </p>

              <p className="mt-1 text-xs leading-5 text-white/65">
                Explora las áreas,
                conoce lo que hace cada
                equipo y cuando
                encuentres una que
                conecte contigo, podrás
                enviar tu solicitud.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            ESTADO DEL USUARIO NUEVO
        ================================================= */}

        {user &&
        (profile?.role ===
          "new_volunteer" ||
          profile?.role ===
            "member") ? (
          <section className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <HeartHandshake
                  size={20}
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Tu camino comienza aquí
                </p>

                <h2 className="mt-1 text-lg font-semibold text-stone-950">
                  Encuentra dónde te
                  gustaría servir
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Ya tienes tu cuenta de
                  Comunidad VID. Ahora
                  puedes conocer nuestros
                  equipos y enviar tu
                  interés directamente a
                  Coordinación.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* =================================================
            MINISTERIOS
        ================================================= */}

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Quiero servir
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Encuentra tu lugar
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Conoce los equipos de
            Comunidad VID y descubre
            dónde te gustaría comenzar.
          </p>

          <div className="mt-5 space-y-3">
            {ministries.map(
              (ministry) => {
                const Icon =
                  ministry.icon;

                const pending =
                  pendingMinistryNames.has(
                    normalize(
                      ministry.name
                    )
                  );

                return (
                  <Link
                    key={
                      ministry.slug
                    }
                    href={`/servir/${ministry.slug}`}
                    className="group flex items-center gap-4 rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-800">
                      <Icon
                        size={21}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-stone-950">
                          {
                            ministry.name
                          }
                        </p>

                        {pending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                            <Clock3
                              size={11}
                            />
                            En revisión
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm leading-5 text-stone-500">
                        {
                          ministry.description
                        }
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-stone-700"
                    />
                  </Link>
                );
              }
            )}
          </div>
        </section>

        {/* =================================================
            USUARIO SIN SESIÓN
        ================================================= */}

        {!user ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-800">
                <LogIn
                  size={20}
                />
              </div>

              <div>
                <p className="font-semibold text-stone-950">
                  ¿Ya tienes cuenta?
                </p>

                <p className="mt-1 text-sm leading-5 text-stone-500">
                  Inicia sesión para que
                  podamos reconocer tus
                  solicitudes y
                  ministerios.
                </p>
              </div>
            </div>

            <Link
              href="/login?next=%2Fservir"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white"
            >
              <LogIn
                size={17}
              />

              Iniciar sesión
            </Link>
          </section>
        ) : null}

        {/* =================================================
            CTA FINAL
        ================================================= */}

        <section className="rounded-[30px] border border-emerald-100 bg-emerald-50 p-5">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2
                  size={17}
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                  Cuenta lista
                </p>
              </div>

              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Elige el equipo que
                conecte contigo
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Puedes conocer cada
                ministerio antes de
                enviar tu solicitud.
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Da el primer paso
              </p>

              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Tu disposición también
                es una forma de servir
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Explora las áreas y
                elige la que más te
                interese. Después
                podremos conocerte
                mejor y acompañarte en
                el proceso.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}