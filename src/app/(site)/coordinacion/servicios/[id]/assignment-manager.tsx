"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  resolveChangeRequestAction,
  saveServiceAssignmentsAction,
} from "./actions";

/* =========================================================
   TIPOS
========================================================= */

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

type AssignmentDetail = {
  assignmentId: string;
  status: AssignmentStatus;
  note: string | null;
};

type Profile = {
  id: string;
  fullName: string;
  positionTitle: string | null;
  ministries: string[];
  authUserId: string | null;
};

type Team = {
  id: string;
  teamName: string;
  emoji: string | null;

  assignedProfileIds: string[];

  assignmentDetails: Record<
    string,
    AssignmentDetail
  >;
};

type Props = {
  servicePlanId: string;
  teams: Team[];
  profiles: Profile[];
};

/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalize(
  value: string
) {
  return value
    .trim()
    .toLocaleLowerCase(
      "es-MX"
    );
}

/* =========================================================
   BADGE DE ESTADO
========================================================= */

function AssignmentStatusBadge({
  status,
}: {
  status: AssignmentStatus;
}) {
  if (
    status ===
    "confirmed"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
        <CheckCircle2
          size={12}
        />

        Confirmó
      </span>
    );
  }

  if (
    status ===
    "change_requested"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
        <RefreshCw
          size={12}
        />

        Solicitó cambio
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
      <Clock3
        size={12}
      />

      Pendiente
    </span>
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function AssignmentManager({
  servicePlanId,
  teams,
  profiles,
}: Props) {
  const router =
    useRouter();

  /* =======================================================
     ASIGNACIONES QUE VIENEN DEL SERVIDOR
  ======================================================= */

  const initialAssignments =
    useMemo(
      () =>
        Object.fromEntries(
          teams.map(
            (team) => [
              team.id,
              [
                ...team.assignedProfileIds,
              ],
            ]
          )
        ),
      [teams]
    );

  /* =======================================================
     DETALLES REALES QUE VIENEN DE SUPABASE
  ======================================================= */

  const detailMap =
    useMemo(
      () =>
        Object.fromEntries(
          teams.map(
            (team) => [
              team.id,
              team.assignmentDetails,
            ]
          )
        ),
      [teams]
    );

  /* =======================================================
     ESTADO LOCAL
  ======================================================= */

  const [
    assignments,
    setAssignments,
  ] =
    useState<
      Record<
        string,
        string[]
      >
    >(
      initialAssignments
    );

  const [
    replacementSelection,
    setReplacementSelection,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    resolvingAssignmentId,
    setResolvingAssignmentId,
  ] =
    useState<
      string | null
    >(null);

  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      | "success"
      | "error"
      | null
    >(null);

  /* =======================================================
     MUY IMPORTANTE

     Cuando router.refresh() obtiene nuevos datos de Supabase,
     sincronizamos nuevamente el estado local.

     Esto evita tener que salir de la pantalla y volver
     a entrar para ver los cambios.
  ======================================================= */

  useEffect(() => {
    setAssignments(
      initialAssignments
    );
  }, [
    initialAssignments,
  ]);

  /* =======================================================
     PERSONAS YA ASIGNADAS EN CUALQUIER EQUIPO
  ======================================================= */

  const globallySelectedProfileIds =
    useMemo(
      () =>
        new Set(
          Object.values(
            assignments
          ).flat()
        ),
      [
        assignments,
      ]
    );

  /* =======================================================
     MARCAR / DESMARCAR PERSONA
  ======================================================= */

  function toggleProfile(
    teamId: string,
    profileId: string
  ) {
    setAssignments(
      (current) => {
        const currentIds =
          current[
            teamId
          ] ?? [];

        const exists =
          currentIds.includes(
            profileId
          );

        return {
          ...current,

          [teamId]:
            exists
              ? currentIds.filter(
                  (id) =>
                    id !==
                    profileId
                )
              : [
                  ...currentIds,
                  profileId,
                ],
        };
      }
    );

    setMessage(null);

    setMessageType(null);
  }

  /* =======================================================
     GUARDAR ASIGNACIONES GENERALES
  ======================================================= */

  async function save() {
    setSaving(true);

    setMessage(null);

    setMessageType(null);

    try {
      const result =
        await saveServiceAssignmentsAction(
          servicePlanId,

          teams.map(
            (team) => ({
              teamId:
                team.id,

              profileIds:
                assignments[
                  team.id
                ] ?? [],
            })
          )
        );

      if (
        !result.success
      ) {
        setMessage(
          result.error ||
            "No se pudieron guardar las asignaciones."
        );

        setMessageType(
          "error"
        );

        return;
      }

      setMessage(
        "Asignaciones guardadas correctamente."
      );

      setMessageType(
        "success"
      );

      /*
       * Traemos nuevamente los datos reales
       * desde el servidor.
       */
      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "save assignments:",
        error
      );

      setMessage(
        "No fue posible guardar las asignaciones."
      );

      setMessageType(
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     ENCONTRAR PERSONA ORIGINAL DE UNA SOLICITUD
  ======================================================= */

  function findChangeRequester(
    assignmentId: string
  ) {
    for (
      const team
      of teams
    ) {
      for (
        const [
          profileId,
          detail,
        ]
        of Object.entries(
          team.assignmentDetails
        )
      ) {
        if (
          detail.assignmentId ===
          assignmentId
        ) {
          return {
            teamId:
              team.id,

            profileId,
          };
        }
      }
    }

    return null;
  }

  /* =======================================================
     RESOLVER SOLICITUD DE CAMBIO
  ======================================================= */

  async function resolveChange(
    assignmentId: string
  ) {
    const replacementId =
      replacementSelection[
        assignmentId
      ];

    if (
      !replacementId
    ) {
      setMessage(
        "Selecciona primero a la persona que cubrirá el servicio."
      );

      setMessageType(
        "error"
      );

      return;
    }

    /*
     * Guardamos quién era la persona original
     * ANTES de modificar nada.
     */
    const requester =
      findChangeRequester(
        assignmentId
      );

    if (
      !requester
    ) {
      setMessage(
        "No fue posible identificar la asignación que solicitó el cambio."
      );

      setMessageType(
        "error"
      );

      return;
    }

    setResolvingAssignmentId(
      assignmentId
    );

    setMessage(null);

    setMessageType(null);

    try {
      const result =
        await resolveChangeRequestAction(
          assignmentId,
          replacementId
        );

      if (
        !result.success
      ) {
        setMessage(
          result.error ||
            "No se pudo resolver la solicitud."
        );

        setMessageType(
          "error"
        );

        return;
      }

      /* ===================================================
         ACTUALIZACIÓN INMEDIATA DE LA PANTALLA

         Brenda sale.
         Elizabeth entra.

         No esperamos al refresh para que el usuario
         vea el resultado.
      =================================================== */

      setAssignments(
        (current) => {
          const currentIds =
            current[
              requester.teamId
            ] ?? [];

          const withoutRequester =
            currentIds.filter(
              (profileId) =>
                profileId !==
                requester.profileId
            );

          const nextIds =
            withoutRequester.includes(
              replacementId
            )
              ? withoutRequester
              : [
                  ...withoutRequester,
                  replacementId,
                ];

          return {
            ...current,

            [requester.teamId]:
              nextIds,
          };
        }
      );

      /* ===================================================
         LIMPIAR SELECTOR
      =================================================== */

      setReplacementSelection(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            assignmentId
          ];

          return next;
        }
      );

      /* ===================================================
         MENSAJE
      =================================================== */

      setMessage(
        `${result.replacementName} fue asignado correctamente. La solicitud quedó resuelta.`
      );

      setMessageType(
        "success"
      );

      /* ===================================================
         PEDIR AL SERVIDOR LOS DATOS DEFINITIVOS

         Cuando llegan, useEffect vuelve a sincronizar
         assignments con Supabase.
      =================================================== */

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "resolve change:",
        error
      );

      setMessage(
        "No fue posible resolver la solicitud de cambio."
      );

      setMessageType(
        "error"
      );
    } finally {
      setResolvingAssignmentId(
        null
      );
    }
  }

  /* =======================================================
     INTERFAZ
  ======================================================= */

  return (
    <div className="space-y-5">
      {teams.map(
        (team) => {
          /* =================================================
             PERSONAS PERTENECIENTES AL MINISTERIO
          ================================================= */

          const teamProfiles =
            profiles.filter(
              (profile) =>
                profile.ministries.some(
                  (
                    ministry
                  ) =>
                    normalize(
                      ministry
                    ) ===
                    normalize(
                      team.teamName
                    )
                )
            );

          const selected =
            assignments[
              team.id
            ] ?? [];

          return (
            <section
              key={
                team.id
              }
              className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"
            >
              {/* ============================================
                  CABECERA EQUIPO
              ============================================ */}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl">
                    {team.emoji ||
                      "🤝"}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-stone-950">
                    {
                      team.teamName
                    }
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    {
                      selected.length
                    }{" "}
                    asignado
                    {selected.length ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <Users
                    size={20}
                  />
                </div>
              </div>

              {/* ============================================
                  SIN PERFILES
              ============================================ */}

              {teamProfiles.length ===
              0 ? (
                <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
                  No hay perfiles
                  registrados en este
                  ministerio.
                </div>
              ) : (
                /* ==========================================
                   PERSONAS
                ========================================== */

                <div className="mt-5 space-y-3">
                  {teamProfiles.map(
                    (
                      profile
                    ) => {
                      const checked =
                        selected.includes(
                          profile.id
                        );

                      const detail =
                        detailMap[
                          team.id
                        ]?.[
                          profile.id
                        ];

                      const originalStatus =
                        detail?.status;

                      const isChangeRequest =
                        checked &&
                        originalStatus ===
                          "change_requested";

                      /* =====================================
                         SOLICITUD DE CAMBIO
                      ===================================== */

                      if (
                        isChangeRequest &&
                        detail
                      ) {
                        const replacementCandidates =
                          teamProfiles.filter(
                            (
                              candidate
                            ) =>
                              candidate.id !==
                                profile.id &&
                              !globallySelectedProfileIds.has(
                                candidate.id
                              )
                          );

                        return (
                          <div
                            key={
                              profile.id
                            }
                            className="overflow-hidden rounded-[24px] border border-red-200 bg-red-50"
                          >
                            {/* ==============================
                                PERSONA
                            ============================== */}

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-stone-950">
                                      {
                                        profile.fullName
                                      }
                                    </p>

                                    <AssignmentStatusBadge
                                      status="change_requested"
                                    />
                                  </div>

                                  <p className="mt-1 text-xs text-stone-500">
                                    {profile.positionTitle ||
                                      "Servidor"}
                                  </p>
                                </div>

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                                  <AlertTriangle
                                    size={
                                      17
                                    }
                                  />
                                </div>
                              </div>

                              {/* ============================
                                  MOTIVO
                              ============================ */}

                              <div className="mt-4 rounded-[18px] border border-red-100 bg-white p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
                                  Motivo
                                </p>

                                <p className="mt-2 text-sm leading-6 text-stone-700">
                                  {detail.note ||
                                    "No se registró un motivo."}
                                </p>
                              </div>
                            </div>

                            {/* ==============================
                                RESOLVER
                            ============================== */}

                            <div className="border-t border-red-100 bg-white p-4">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft
                                  size={
                                    17
                                  }
                                  className="text-stone-700"
                                />

                                <p className="text-sm font-semibold text-stone-950">
                                  Resolver
                                  solicitud
                                </p>
                              </div>

                              <p className="mt-1 text-xs leading-5 text-stone-500">
                                Selecciona a
                                la persona que
                                cubrirá esta
                                asignación.
                              </p>

                              {replacementCandidates.length >
                              0 ? (
                                <>
                                  <select
                                    value={
                                      replacementSelection[
                                        detail
                                          .assignmentId
                                      ] ??
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setReplacementSelection(
                                        (
                                          current
                                        ) => ({
                                          ...current,

                                          [detail.assignmentId]:
                                            event
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    className="mt-4 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-950 outline-none focus:border-stone-400"
                                  >
                                    <option value="">
                                      Seleccionar
                                      reemplazo
                                    </option>

                                    {replacementCandidates.map(
                                      (
                                        candidate
                                      ) => (
                                        <option
                                          key={
                                            candidate.id
                                          }
                                          value={
                                            candidate.id
                                          }
                                        >
                                          {
                                            candidate.fullName
                                          }

                                          {candidate.positionTitle
                                            ? ` · ${candidate.positionTitle}`
                                            : ""}
                                        </option>
                                      )
                                    )}
                                  </select>

                                  <button
                                    type="button"
                                    disabled={
                                      resolvingAssignmentId ===
                                        detail.assignmentId ||
                                      !replacementSelection[
                                        detail
                                          .assignmentId
                                      ]
                                    }
                                    onClick={() =>
                                      resolveChange(
                                        detail.assignmentId
                                      )
                                    }
                                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {resolvingAssignmentId ===
                                    detail.assignmentId ? (
                                      <>
                                        <Loader2
                                          size={
                                            17
                                          }
                                          className="animate-spin"
                                        />

                                        Resolviendo...
                                      </>
                                    ) : (
                                      <>
                                        <ArrowRightLeft
                                          size={
                                            17
                                          }
                                        />

                                        Confirmar
                                        reemplazo
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                                  No hay otra
                                  persona
                                  disponible en
                                  este
                                  ministerio.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      /* =====================================
                         PERSONA NORMAL
                      ===================================== */

                      return (
                        <button
                          key={
                            profile.id
                          }
                          type="button"
                          onClick={() =>
                            toggleProfile(
                              team.id,
                              profile.id
                            )
                          }
                          className={`w-full rounded-[20px] border p-4 text-left transition ${
                            checked
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-stone-200 bg-white hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-stone-950">
                                  {
                                    profile.fullName
                                  }
                                </p>

                                {/* ==========================
                                    ESTADO REAL
                                ========================== */}

                                {checked &&
                                originalStatus ? (
                                  <AssignmentStatusBadge
                                    status={
                                      originalStatus
                                    }
                                  />
                                ) : null}

                                {/* ==========================
                                    NUEVA SELECCIÓN MANUAL
                                ========================== */}

                                {checked &&
                                !originalStatus ? (
                                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700">
                                    Nueva
                                    asignación
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 text-xs text-stone-500">
                                {profile.positionTitle ||
                                  "Servidor"}
                              </p>
                            </div>

                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                                checked
                                  ? "bg-emerald-600 text-white"
                                  : "border border-stone-300 bg-white text-stone-400"
                              }`}
                            >
                              {checked ? (
                                <Check
                                  size={
                                    17
                                  }
                                />
                              ) : null}
                            </div>
                          </div>

                          {/* ================================
                              CONFIRMADO
                          ================================ */}

                          {checked &&
                          originalStatus ===
                            "confirmed" ? (
                            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-emerald-700">
                              Esta persona ya
                              confirmó su
                              asistencia para
                              este servicio.
                            </p>
                          ) : null}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          );
        }
      )}

      {/* ===================================================
          MENSAJE DE RESULTADO
      =================================================== */}

      {message ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            messageType ===
            "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      {/* ===================================================
          GUARDAR
      =================================================== */}

      <button
        type="button"
        onClick={
          save
        }
        disabled={
          saving ||
          resolvingAssignmentId !==
            null
        }
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 font-semibold text-white disabled:opacity-60"
      >
        {saving ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <Save
            size={18}
          />
        )}

        {saving
          ? "Guardando..."
          : "Guardar asignaciones"}
      </button>

      <p className="px-2 text-center text-xs leading-5 text-stone-400">
        Al guardar, las confirmaciones existentes
        se conservan. Las solicitudes de cambio se
        resuelven desde su tarjeta.
      </p>
    </div>
  );
}