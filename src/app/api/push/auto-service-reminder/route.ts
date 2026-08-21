import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAuthUser } from "@/lib/push/server";

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

type AssignmentRow = {
  id: string;
  profile_id: string;
  service_plan_id: string;
  team_id: string;
  status: AssignmentStatus;

  profiles:
    | {
        id: string;
        full_name: string;
        auth_user_id: string | null;
      }
    | {
        id: string;
        full_name: string;
        auth_user_id: string | null;
      }[]
    | null;

  service_plans:
    | {
        id: string;
        service_date: string;
        title: string;
        service_time: string | null;
      }
    | {
        id: string;
        service_date: string;
        title: string;
        service_time: string | null;
      }[]
    | null;

  service_teams:
    | {
        id: string;
        team_name: string;
        arrival_time: string | null;
        service_time: string | null;
      }
    | {
        id: string;
        team_name: string;
        arrival_time: string | null;
        service_time: string | null;
      }[]
    | null;
};

/* =========================================================
   NORMALIZAR RELACIONES SUPABASE
========================================================= */

function firstRelation<T>(
  value: T | T[] | null
): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/* =========================================================
   HOY EN CDMX
========================================================= */

function getMexicoCityToday() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Mexico_City",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ]
      )
    );

  return `${values.year}-${values.month}-${values.day}`;
}

/* =========================================================
   DIFERENCIA DE DÍAS
========================================================= */

function getDaysUntil(
  targetDate: string
) {
  const today =
    getMexicoCityToday();

  const [
    todayYear,
    todayMonth,
    todayDay,
  ] = today
    .split("-")
    .map(Number);

  const [
    targetYear,
    targetMonth,
    targetDay,
  ] = targetDate
    .split("-")
    .map(Number);

  const todayUTC =
    Date.UTC(
      todayYear,
      todayMonth - 1,
      todayDay
    );

  const targetUTC =
    Date.UTC(
      targetYear,
      targetMonth - 1,
      targetDay
    );

  return Math.round(
    (targetUTC -
      todayUTC) /
      86_400_000
  );
}

/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatServiceDate(
  dateValue: string
) {
  const [
    year,
    month,
    day,
  ] = dateValue
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      timeZone:
        "America/Mexico_City",

      weekday: "long",
      day: "numeric",
      month: "long",
    }
  ).format(date);
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       0. SEGURIDAD DEL CRON

       LOCALHOST:
       Permitimos ejecutar manualmente la URL.

       PRODUCCIÓN:
       Vercel debe enviar:
       Authorization: Bearer <CRON_SECRET>
    ====================================================== */

    const isProduction =
      process.env.NODE_ENV ===
      "production";

    if (isProduction) {
      const cronSecret =
        process.env.CRON_SECRET;

      if (!cronSecret) {
        console.error(
          "CRON_SECRET no está configurado."
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "CRON_SECRET no está configurado.",
          },
          {
            status: 500,
          }
        );
      }

      const authorization =
        request.headers.get(
          "authorization"
        );

      if (
        authorization !==
        `Bearer ${cronSecret}`
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "No autorizado.",
          },
          {
            status: 401,
          }
        );
      }
    }

    /* =====================================================
       1. SUPABASE
    ====================================================== */

    const supabase =
      createAdminClient();

    const today =
      getMexicoCityToday();

    /* =====================================================
       2. ASIGNACIONES PENDIENTES

       service_date viene de service_plans.
    ====================================================== */

    const {
      data,
      error,
    } = await supabase
      .from("assignments")
      .select(
        `
        id,
        profile_id,
        service_plan_id,
        team_id,
        status,

        profiles (
          id,
          full_name,
          auth_user_id
        ),

        service_plans (
          id,
          service_date,
          title,
          service_time
        ),

        service_teams (
          id,
          team_name,
          arrival_time,
          service_time
        )
        `
      )
      .eq(
        "status",
        "pending"
      );

    if (error) {
      return NextResponse.json(
        {
          ok: false,

          step:
            "assignments",

          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    const assignments =
      (data ??
        []) as AssignmentRow[];

    /* =====================================================
       3. CONTADORES
    ====================================================== */

    let reviewed = 0;
    let eligible = 0;
    let sent = 0;
    let failed = 0;

    let skippedPast = 0;
    let skippedOutsideWindow =
      0;
    let skippedNoAccount = 0;
    let skippedAlreadySent = 0;
    let skippedNoPlan = 0;

    const results: Array<{
      assignmentId: string;
      profileName:
        | string
        | null;
      serviceDate:
        | string
        | null;
      daysUntil:
        | number
        | null;
      result: string;
    }> = [];

    /* =====================================================
       4. REVISAR ASIGNACIONES
    ====================================================== */

    for (
      const assignment of
      assignments
    ) {
      reviewed++;

      const profile =
        firstRelation(
          assignment.profiles
        );

      const plan =
        firstRelation(
          assignment.service_plans
        );

      const team =
        firstRelation(
          assignment.service_teams
        );

      /* ===================================================
         PLAN
      =================================================== */

      if (
        !plan?.service_date
      ) {
        skippedNoPlan++;

        results.push({
          assignmentId:
            assignment.id,

          profileName:
            profile?.full_name ??
            null,

          serviceDate:
            null,

          daysUntil:
            null,

          result:
            "Sin plan o fecha",
        });

        continue;
      }

      const daysUntil =
        getDaysUntil(
          plan.service_date
        );

      /* ===================================================
         SERVICIO PASADO
      =================================================== */

      if (
        daysUntil < 0
      ) {
        skippedPast++;

        continue;
      }

      /* ===================================================
         VENTANA DE PRODUCCIÓN

         Enviamos recordatorios desde
         3 días antes hasta el mismo día.
      =================================================== */

      if (
        daysUntil > 3
      ) {
        skippedOutsideWindow++;

        continue;
      }

      eligible++;

      /* ===================================================
         CUENTA VINCULADA
      =================================================== */

      if (
        !profile?.auth_user_id
      ) {
        skippedNoAccount++;

        results.push({
          assignmentId:
            assignment.id,

          profileName:
            profile?.full_name ??
            null,

          serviceDate:
            plan.service_date,

          daysUntil,

          result:
            "Sin cuenta Auth vinculada",
        });

        continue;
      }

      /* ===================================================
         EVITAR DUPLICADOS
      =================================================== */

      const dedupeKey =
        `service-confirmation-reminder-${assignment.id}-${plan.service_date}`;

      const {
        data: existingLog,
        error:
          existingLogError,
      } = await supabase
        .from(
          "push_delivery_log"
        )
        .select("id")
        .eq(
          "dedupe_key",
          dedupeKey
        )
        .maybeSingle();

      if (
        existingLogError
      ) {
        failed++;

        results.push({
          assignmentId:
            assignment.id,

          profileName:
            profile.full_name,

          serviceDate:
            plan.service_date,

          daysUntil,

          result:
            `Error revisando log: ${existingLogError.message}`,
        });

        continue;
      }

      if (existingLog) {
        skippedAlreadySent++;

        results.push({
          assignmentId:
            assignment.id,

          profileName:
            profile.full_name,

          serviceDate:
            plan.service_date,

          daysUntil,

          result:
            "Recordatorio ya enviado",
        });

        continue;
      }

      /* ===================================================
         MENSAJE
      =================================================== */

      const firstName =
        profile.full_name
          ?.trim()
          .split(/\s+/)[0] ||
        "Hola";

      const teamName =
        team?.team_name ||
        "tu equipo";

      const dateText =
        formatServiceDate(
          plan.service_date
        );

      let title =
        "⏰ Tu servicio está próximo";

      let body =
        `${firstName}, aún no has confirmado tu asistencia para ${teamName} el ${dateText}.`;

      if (
        team?.arrival_time
      ) {
        body +=
          ` Llegada: ${team.arrival_time}.`;
      }

      body +=
        " Entra a Comunidad VID para confirmar o solicitar un cambio.";

      /* ===================================================
         MENSAJE ESPECIAL EL MISMO DÍA
      =================================================== */

      if (
        daysUntil === 0
      ) {
        title =
          "🙌 Hoy tienes servicio";

        body =
          `${firstName}, hoy estás asignado a ${teamName} y tu asistencia sigue pendiente de confirmar.`;

        if (
          team?.arrival_time
        ) {
          body +=
            ` Llegada: ${team.arrival_time}.`;
        }

        body +=
          " Revisa tu servicio en Comunidad VID.";
      }

      /* ===================================================
         ENVIAR PUSH
      =================================================== */

      try {
        const pushResult =
          await sendPushToAuthUser({
            authUserId:
              profile.auth_user_id,

            payload: {
              title,

              body,

              url:
                "/mi-servicio",

              tag:
                `service-reminder-${assignment.id}`,

              requireInteraction:
                daysUntil === 0,

              assignmentId:
                assignment.id,

              servicePlanId:
                assignment.service_plan_id,
            },
          });

        sent +=
          pushResult.sent;

        failed +=
          pushResult.failed;

        /* =================================================
           SOLO REGISTRAR SI REALMENTE SE ENVIÓ
        ================================================= */

        if (
          pushResult.sent > 0
        ) {
          const {
            error:
              insertLogError,
          } = await supabase
            .from(
              "push_delivery_log"
            )
            .insert({
              kind:
                "service-confirmation-reminder",

              dedupe_key:
                dedupeKey,

              payload: {
                assignment_id:
                  assignment.id,

                profile_id:
                  assignment.profile_id,

                profile_name:
                  profile.full_name,

                auth_user_id:
                  profile.auth_user_id,

                service_plan_id:
                  assignment.service_plan_id,

                service_date:
                  plan.service_date,

                team_id:
                  assignment.team_id,

                team_name:
                  team?.team_name ??
                  null,

                arrival_time:
                  team?.arrival_time ??
                  null,

                service_time:
                  team?.service_time ??
                  plan.service_time ??
                  null,

                days_until:
                  daysUntil,

                sent:
                  pushResult.sent,

                failed:
                  pushResult.failed,
              },
            });

          if (
            insertLogError
          ) {
            console.error(
              "No se pudo guardar push_delivery_log:",
              insertLogError
            );
          }

          results.push({
            assignmentId:
              assignment.id,

            profileName:
              profile.full_name,

            serviceDate:
              plan.service_date,

            daysUntil,

            result:
              `Enviado a ${pushResult.sent} dispositivo(s)`,
          });
        } else {
          results.push({
            assignmentId:
              assignment.id,

            profileName:
              profile.full_name,

            serviceDate:
              plan.service_date,

            daysUntil,

            result:
              "No hay dispositivo Push activo",
          });
        }
      } catch (pushError) {
        failed++;

        console.error(
          "ERROR RECORDATORIO SERVICIO:",
          pushError
        );

        results.push({
          assignmentId:
            assignment.id,

          profileName:
            profile.full_name,

          serviceDate:
            plan.service_date,

          daysUntil,

          result:
            pushError instanceof
            Error
              ? pushError.message
              : "Error enviando Push",
        });
      }
    }

    /* =====================================================
       5. RESULTADO
    ====================================================== */

    return NextResponse.json({
      ok: true,

      mode:
        "PRODUCTION_3_DAYS",

      today,

      reviewed,

      eligible,

      sent,

      failed,

      skipped: {
        past:
          skippedPast,

        outsideWindow:
          skippedOutsideWindow,

        noPlan:
          skippedNoPlan,

        noAccount:
          skippedNoAccount,

        alreadySent:
          skippedAlreadySent,
      },

      results,
    });
  } catch (error) {
    console.error(
      "AUTO SERVICE REMINDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}