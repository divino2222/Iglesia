import MyNextServiceCard from "@/components/home/my-next-service-card";
import TodaySundayBanner from "@/components/home/today-sunday-banner";
import TodayPrayerBanner from "@/components/home/today-prayer-banner";

import { createClient } from "@/lib/supabase/server";

import {
  getAppTodayString,
} from "@/lib/date-time";

import {
  getCurrentUser,
} from "@/lib/auth/current-user";

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

export default async function HomePriorityStack() {
  /*
   * Esta lectura queda compartida con
   * MyNextServiceCard gracias a cache().
   */
  const user =
    await getCurrentUser();

  let nextStatus:
    | AssignmentStatus
    | null = null;

  if (user) {
    const supabase =
      await createClient();

    /* =====================================================
       PERFIL
    ====================================================== */

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq(
        "auth_user_id",
        user.id
      )
      .maybeSingle();

    if (
      !profileError &&
      profile
    ) {
      /* ===================================================
         ASIGNACIONES
      =================================================== */

      const {
        data: assignments,
        error: assignmentsError,
      } = await supabase
        .from("assignments")
        .select(
          `
          id,
          status,
          service_plans (
            service_date
          )
          `
        )
        .eq(
          "profile_id",
          profile.id
        );

      if (
        !assignmentsError
      ) {
        const today =
          getAppTodayString();

        const futureAssignments =
          (
            assignments ??
            []
          )
            .filter(
              (
                assignment
              ) => {
                const plan =
                  Array.isArray(
                    assignment.service_plans
                  )
                    ? assignment
                        .service_plans[0]
                    : assignment
                        .service_plans;

                return (
                  plan?.service_date &&
                  plan.service_date >=
                    today
                );
              }
            )
            .sort(
              (a, b) => {
                const planA =
                  Array.isArray(
                    a.service_plans
                  )
                    ? a
                        .service_plans[0]
                    : a
                        .service_plans;

                const planB =
                  Array.isArray(
                    b.service_plans
                  )
                    ? b
                        .service_plans[0]
                    : b
                        .service_plans;

                return String(
                  planA?.service_date ||
                    ""
                ).localeCompare(
                  String(
                    planB?.service_date ||
                      ""
                  )
                );
              }
            );

        nextStatus =
          (
            futureAssignments[0]
              ?.status as AssignmentStatus
          ) ?? null;
      }
    }
  }

  /* =======================================================
     PRIORIDAD
  ======================================================= */

  const hasUrgentService =
    nextStatus ===
      "pending" ||
    nextStatus ===
      "change_requested";

  /*
   * URGENTE
   *
   * 1. Mi servicio
   * 2. Domingo
   * 3. Oración
   */

  if (hasUrgentService) {
    return (
      <div className="space-y-4">
        <MyNextServiceCard />

        <TodaySundayBanner />

        <TodayPrayerBanner />
      </div>
    );
  }

  /*
   * NORMAL
   *
   * 1. Domingo
   * 2. Oración
   * 3. Mi servicio
   */

  return (
    <div className="space-y-4">
      <TodaySundayBanner />

      <TodayPrayerBanner />

      <MyNextServiceCard />
    </div>
  );
}