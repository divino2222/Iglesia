import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  MessageCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requestAssignmentChange } from "../actions";

type PageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

function formatDate(dateValue: string) {
  const [year, month, day] =
    dateValue.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SolicitarCambioPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const assignmentId = params?.id;

  if (!assignmentId) {
    redirect("/mi-servicio");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/mi-cuenta");
  }

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      status,
      note,
      profile_id,

      service_plans (
        service_date,
        title,
        service_time
      ),

      service_teams (
        team_name,
        emoji,
        arrival_time
      )
      `
    )
    .eq("id", assignmentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    redirect("/mi-servicio");
  }

  const plan = Array.isArray(
    assignment.service_plans
  )
    ? assignment.service_plans[0]
    : assignment.service_plans;

  const team = Array.isArray(
    assignment.service_teams
  )
    ? assignment.service_teams[0]
    : assignment.service_teams;

  return (
    <div className="space-y-5 px-4 py-6 pb-28">
      <section className="overflow-hidden rounded-[34px] border border-amber-100 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        {/* CABECERA */}

        <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 px-5 py-7 text-stone-950">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <MessageCircle size={13} />

            Solicitud
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Solicitar cambio
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-800">
            Avísanos si no podrás cubrir esta asignación.
          </p>
        </div>

        <div className="space-y-4 p-5">
          {/* SERVIDOR */}

          <div className="rounded-[26px] border border-stone-100 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Servidor
            </p>

            <p className="mt-1 text-lg font-semibold text-stone-950">
              {profile.full_name}
            </p>
          </div>

          {/* ASIGNACIÓN */}

          <div className="rounded-[26px] border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Asignación
            </p>

            <p className="mt-1 text-xl font-semibold text-stone-950">
              {team?.emoji || "🤝"}{" "}
              {team?.team_name}
            </p>

            {plan ? (
              <p className="mt-2 text-sm text-stone-600">
                {formatDate(
                  plan.service_date
                )}{" "}
                · {plan.service_time}
              </p>
            ) : null}
          </div>

          {/* AVISO */}

          <div className="flex items-start gap-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <p className="text-sm leading-6 text-stone-700">
              Solicitar un cambio no elimina tu
              asignación automáticamente.
              Coordinación revisará tu solicitud
              y decidirá cómo reorganizar el
              equipo.
            </p>
          </div>

          {/* FORMULARIO */}

          <form
            action={
              requestAssignmentChange
            }
            className="space-y-4"
          >
            <input
              type="hidden"
              name="assignment_id"
              value={assignment.id}
            />

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Motivo del cambio
              </span>

              <textarea
                name="note"
                required
                minLength={5}
                defaultValue={
                  assignment.note ?? ""
                }
                rows={5}
                placeholder="Cuéntanos brevemente por qué necesitas solicitar un cambio."
                className="w-full rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-950 outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-amber-500 px-5 py-4 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-amber-400"
            >
              <MessageCircle size={18} />

              {assignment.status ===
              "change_requested"
                ? "Actualizar solicitud"
                : "Enviar solicitud de cambio"}
            </button>
          </form>

          <Link
            href="/mi-servicio"
            className="flex w-full items-center justify-center rounded-[22px] border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-700"
          >
            Cancelar
          </Link>
        </div>
      </section>
    </div>
  );
}