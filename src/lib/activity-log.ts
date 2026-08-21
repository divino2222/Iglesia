import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityAction =
  | "confirmed_service"
  | "requested_change"
  | "created_service_plan"
  | "updated_service_plan"
  | "updated_service_team"
  | "assigned_leader"
  | "updated_members"
  | "created_profile"
  | "updated_profile"
  | "resolved_change_request"
  | "reopened_change_request"
  | "admin_confirmed_assignment"
  | "replacement_confirmed"
  | "admin_marked_pending"
  | "linked_profile_account"
  | "unlinked_profile_account"
  | "reassigned_assignment"
  | "kept_assignment_pending"
  | "resolved_assignment_change";

type LogActivityInput = {
  action: ActivityAction;
  entityType: string;
  description: string;

  actorName?: string | null;
  profileId?: string | null;
  entityId?: string | null;
  servicePlanId?: string | null;
  teamId?: string | null;

  metadata?: Record<string, unknown>;
};

export async function logActivity({
  action,
  entityType,
  description,
  actorName = null,
  profileId = null,
  entityId = null,
  servicePlanId = null,
  teamId = null,
  metadata = {},
}: LogActivityInput) {
  const admin = createAdminClient();

  const { error } = await admin.from("activity_log").insert({
    action,
    entity_type: entityType,
    description,

    actor_name: actorName,
    profile_id: profileId,
    entity_id: entityId,
    service_plan_id: servicePlanId,
    team_id: teamId,

    metadata,
  });

  if (error) {
    console.error("No se pudo registrar actividad:", error.message);
  }
}