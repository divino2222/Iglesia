import { createAdminClient } from "@/lib/supabase/admin";
import { sendUserPush } from "@/lib/push/send-user-push";

type SendCoordinatorPushInput = {
  title: string;
  body: string;
  url: string;

  type: string;

  entityType?: string;
  entityId?: string;

  dedupeKey?: string;
  tag?: string;

  /*
   * Podemos excluir al mismo usuario que originó
   * la acción si alguna vez también es coordinador.
   */
  excludeAuthUserId?: string;
};

export async function sendCoordinatorPush(
  input: SendCoordinatorPushInput
) {
  const admin = createAdminClient();

  /*
   * =======================================================
   * 1. OBTENER COORDINADORES
   * =======================================================
   */

  const {
    data: profiles,
    error,
  } = await admin
    .from("profiles")
    .select(
      `
      id,
      full_name,
      role,
      auth_user_id
      `
    )
    .in("role", [
      "coordinator",
      "pastor",
      "admin",
    ])
    .not("auth_user_id", "is", null);

  if (error) {
    throw new Error(
      `No se pudieron consultar los coordinadores: ${error.message}`
    );
  }

  const recipients = (profiles ?? []).filter(
    (profile) =>
      profile.auth_user_id &&
      profile.auth_user_id !== input.excludeAuthUserId
  );

  if (recipients.length === 0) {
    return {
      ok: true,
      recipients: 0,
      sent: 0,
      failed: 0,
    };
  }

  /*
   * =======================================================
   * 2. ENVIAR A CADA COORDINADOR
   * =======================================================
   */

  let sent = 0;
  let failed = 0;

  for (const profile of recipients) {
    if (!profile.auth_user_id) {
      continue;
    }

    try {
      const result = await sendUserPush({
        authUserId: profile.auth_user_id,

        title: input.title,
        body: input.body,
        url: input.url,

        type: input.type,

        entityType:
          input.entityType,

        entityId:
          input.entityId,

        /*
         * El UUID se agrega aquí para que
         * la llave sea única por coordinador.
         */
        dedupeKey: input.dedupeKey
          ? `${input.dedupeKey}-${profile.auth_user_id}`
          : undefined,

        tag: input.tag,
      });

      sent += result.sent ?? 0;
      failed += result.failed ?? 0;
    } catch (error) {
      failed++;

      console.error(
        `COORDINATOR PUSH ERROR (${profile.full_name}):`,
        error
      );
    }
  }

  return {
    ok: true,
    recipients: recipients.length,
    sent,
    failed,
  };
}