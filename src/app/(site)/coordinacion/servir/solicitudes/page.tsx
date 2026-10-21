import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Inbox,
} from "lucide-react";

import { requireAnyPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type MinistryRequestRow = {
  id: string;
  auth_user_id: string;
  ministry_id: string;
  status: string;
  message: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
};

type MinistryRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type RequestCard = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  ministryName: string;
  ministryEmoji: string | null;
  message: string | null;
  createdAt: string;
};

function formatRequestDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function MinistryRequestsPage() {
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

  const admin = createAdminClient();

  /* =======================================================
     SOLICITUDES PENDIENTES
  ======================================================= */

  const {
    data: requestsData,
    error: requestsError,
  } = await admin
    .from("ministry_requests")
    .select(`
      id,
      auth_user_id,
      ministry_id,
      status,
      message,
      created_at
    `)
    .eq("status", "pending")
    .order("created_at", {
      ascending: false,
    });

  if (requestsError) {
    throw new Error(requestsError.message);
  }

  const requests =
    (requestsData ?? []) as MinistryRequestRow[];

  /* =======================================================
     IDS RELACIONADOS
  ======================================================= */

  const authUserIds = [
    ...new Set(
      requests
        .map((request) => request.auth_user_id)
        .filter(Boolean)
    ),
  ];

  const ministryIds = [
    ...new Set(
      requests
        .map((request) => request.ministry_id)
        .filter(Boolean)
    ),
  ];

  /* =======================================================
     PERFILES
  ======================================================= */

  let profiles: ProfileRow[] = [];

  if (authUserIds.length > 0) {
    const {
      data: profilesData,
      error: profilesError,
    } = await admin
      .from("profiles")
      .select(`
        id,
        auth_user_id,
        full_name,
        email,
        phone,
        photo_url
      `)
      .in("auth_user_id", authUserIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    profiles =
      (profilesData ?? []) as ProfileRow[];
  }

  /* =======================================================
     MINISTERIOS
  ======================================================= */

  let ministries: MinistryRow[] = [];

  if (ministryIds.length > 0) {
    const {
      data: ministriesData,
      error: ministriesError,
    } = await admin
      .from("ministries")
      .select(`
        id,
        name,
        emoji
      `)
      .in("id", ministryIds);

    if (ministriesError) {
      throw new Error(ministriesError.message);
    }

    ministries =
      (ministriesData ?? []) as MinistryRow[];
  }

  /* =======================================================
     MAPAS
  ======================================================= */

  const profileByAuthUserId = new Map(
    profiles
      .filter((profile) => profile.auth_user_id)
      .map((profile) => [
        profile.auth_user_id as string,
        profile,
      ])
  );

  const ministryById = new Map(
    ministries.map((ministry) => [
      ministry.id,
      ministry,
    ])
  );

  /* =======================================================
     DATOS PARA UI
  ======================================================= */

  const requestCards: RequestCard[] =
    requests.map((request) => {
      const profile =
        profileByAuthUserId.get(
          request.auth_user_id
        );

      const ministry =
        ministryById.get(
          request.ministry_id
        );

      return {
        id: request.id,

        fullName:
          profile?.full_name ??
          "Persona sin perfil",

        email:
          profile?.email ?? null,

        phone:
          profile?.phone ?? null,

        photoUrl:
          profile?.photo_url ?? null,

        ministryName:
          ministry?.name ??
          "Ministerio",

        ministryEmoji:
          ministry?.emoji ?? null,

        message:
          request.message,

        createdAt:
          request.created_at,
      };
    });

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* =================================================
            VOLVER
        ================================================= */}

        <Link
          href="/coordinacion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} />
          Coordinación
        </Link>

        {/* =================================================
            CABECERA
        ================================================= */}

        <header className="overflow-hidden rounded-[34px] bg-stone-950 p-6 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ClipboardList size={23} />
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Comunidad VID
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Solicitudes para servir
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/65">
                Revisa a las personas que quieren integrarse a
                un ministerio.
              </p>
            </div>

            {requestCards.length > 0 ? (
              <div className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 px-3 text-base font-bold text-white">
                {requestCards.length}
              </div>
            ) : null}
          </div>
        </header>

        {/* =================================================
            RESUMEN
        ================================================= */}

        {requestCards.length > 0 ? (
          <section className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <Clock3
                size={20}
                className="shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {requestCards.length === 1
                    ? "1 solicitud pendiente"
                    : `${requestCards.length} solicitudes pendientes`}
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Estas personas están esperando revisión por
                  parte de Coordinación.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* =================================================
            SIN SOLICITUDES
        ================================================= */}

        {requestCards.length === 0 ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Inbox size={25} />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              No hay solicitudes pendientes
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Cuando alguien solicite integrarse a un
              ministerio, aparecerá aquí para que Coordinación
              pueda revisarlo.
            </p>
          </section>
        ) : (
          /* ===============================================
             LISTADO
          =============================================== */

          <section className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Pendientes de revisión
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Personas interesadas
              </h2>
            </div>

            <div className="space-y-3">
              {requestCards.map((request) => (
                <Link
                  key={request.id}
                  href={`/coordinacion/servir/solicitudes/${request.id}`}
                  className="block rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* FOTO */}

                    {request.photoUrl ? (
                      <img
                        src={request.photoUrl}
                        alt={request.fullName}
                        className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-sm font-bold text-white">
                        {getInitials(
                          request.fullName
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-stone-950">
                            {request.fullName}
                          </p>

                          <p className="mt-1 text-sm font-medium text-stone-600">
                            {request.ministryEmoji
                              ? `${request.ministryEmoji} `
                              : ""}
                            {request.ministryName}
                          </p>
                        </div>

                        <ChevronRight
                          size={19}
                          className="mt-1 shrink-0 text-stone-300"
                        />
                      </div>

                      {request.message ? (
                        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                            Nos compartió
                          </p>

                          <p className="mt-1 text-sm leading-5 text-stone-700">
                            {request.message}
                          </p>
                        </div>
                      ) : null}

                      <p className="mt-3 text-xs text-stone-400">
                        {formatRequestDate(
                          request.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}