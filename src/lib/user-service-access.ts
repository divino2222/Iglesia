import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function hasUpcomingAssignment(
  profileId: string
) {
  const admin = createAdminClient();

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const {
    data,
    error,
  } = await admin
    .from("service_assignments")
    .select(`
      id,
      service_plans!service_assignments_service_plan_id_fkey (
        service_date
      )
    `)
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(
      `No se pudo consultar la asignación del usuario: ${error.message}`
    );
  }

  return (data ?? []).some((row) => {
    const relation =
      Array.isArray(row.service_plans)
        ? row.service_plans[0]
        : row.service_plans;

    return (
      relation?.service_date &&
      relation.service_date >= today
    );
  });
}