import Link from "next/link";
import { getServingAdminData } from "@/lib/serving-admin";
import {
  createNextSundayPlan,
  updateServicePlan,
  updateServiceTeam,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    pin?: string;
    plan?: string;
  }>;
};

function getStatusLabel(status: string) {
  if (status === "ready") return "Confirmado";
  if (status === "attention") return "Revisar";
  return "Por confirmar";
}

function getStatusClass(status: string) {
  if (status === "ready") return "bg-emerald-100 text-emerald-700";
  if (status === "attention") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function getResponseLabel(status?: string) {
  if (status === "confirmed") return "Confirmó";
  if (status === "change_requested") return "Pidió cambio";
  return "Pendiente";
}

function getResponseClass(status?: string) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "change_requested") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AdminServirPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pin = params?.pin;
  const selectedPlanId = params?.plan;
  const validPin = process.env.SERVING_ADMIN_PIN;

  if (!validPin || pin !== validPin) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Panel privado
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-stone-950">
            Acceso de coordinador
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Agrega el PIN al final de la URL para entrar.
          </p>

          <div className="mt-4 rounded-2xl bg-stone-100 p-3 text-sm text-stone-700">
            /admin/servir?pin=TU_PIN
          </div>
        </div>
      </div>
    );
  }

  const { plan, plans, teams, profiles, assignments } =
    await getServingAdminData(selectedPlanId);

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] bg-white p-6">
          No hay plan de servicio creado todavía.
        </div>
      </div>
    );
  }

  const readyTeams = teams.filter((team) => team.status === "ready").length;
  const pendingTeams = teams.filter((team) => team.status === "pending").length;
  const attentionTeams = teams.filter(
    (team) => team.status === "attention"
  ).length;

  const confirmedCount = assignments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const changeRequestedCount = assignments.filter(
    (item) => item.status === "change_requested"
  ).length;

  const pendingResponseCount = assignments.filter(
    (item) => item.status === "pending"
  ).length;

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const assignmentsByTeam = new Map<string, typeof assignments>();

  assignments.forEach((assignment) => {
    const current = assignmentsByTeam.get(assignment.team_id) ?? [];
    current.push(assignment);
    assignmentsByTeam.set(assignment.team_id, current);
  });

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Panel privado
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-stone-950">
            Administrar servidores
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Editando:{" "}
            <span className="font-semibold text-stone-950">
              {formatDate(plan.service_date)}
            </span>
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {readyTeams}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">
                Listos
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">
                {pendingTeams}
              </p>
              <p className="text-[11px] font-semibold text-amber-700">
                Pendientes
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <p className="text-xl font-bold text-red-700">
                {attentionTeams}
              </p>
              <p className="text-[11px] font-semibold text-red-700">
                Revisar
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {confirmedCount}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">
                Confirmaron
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">
                {pendingResponseCount}
              </p>
              <p className="text-[11px] font-semibold text-amber-700">
                Sin responder
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <p className="text-xl font-bold text-red-700">
                {changeRequestedCount}
              </p>
              <p className="text-[11px] font-semibold text-red-700">
                Pidieron cambio
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Historial
          </p>

          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Servicios creados
          </h2>

          <div className="mt-4 space-y-2">
            {plans.map((item) => {
              const active = item.id === plan.id;

              return (
                <Link
                  key={item.id}
                  href={`/admin/servir?pin=${encodeURIComponent(
                    pin
                  )}&plan=${item.id}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-950 hover:bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatDate(item.service_date)}
                    </p>
                    <p
                      className={`text-xs ${
                        active ? "text-white/70" : "text-stone-500"
                      }`}
                    >
                      {item.title} · {item.service_time}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-white/15 text-white"
                        : getStatusClass(item.status)
                    }`}
                  >
                    {active ? "Editando" : getStatusLabel(item.status)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <form
          action={createNextSundayPlan}
          className="rounded-[34px] border border-sky-200 bg-sky-50 p-5 shadow-sm"
        >
          <input type="hidden" name="plan_id" value={plan.id} />

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Planeación semanal
          </p>

          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Crear próximo domingo
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-700">
            Duplica este plan para el siguiente domingo, conservando equipos,
            horarios y checklist. Los responsables e integrantes quedarán
            pendientes de asignar.
          </p>

          <button className="mt-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
            📅 Crear próximo domingo
          </button>

          <p className="mt-3 text-xs text-stone-500">
            Esta acción crea un nuevo servicio para el siguiente domingo. No
            modifica el servicio actual.
          </p>
        </form>

        <form
          action={updateServicePlan}
          className="space-y-4 rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="id" defaultValue={plan.id} />

          <h2 className="text-xl font-semibold text-stone-950">
            Datos del servicio
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título" name="title" defaultValue={plan.title} />
            <Field
              label="Fecha"
              name="service_date"
              type="date"
              defaultValue={plan.service_date}
            />
            <Field
              label="Hora"
              name="service_time"
              defaultValue={plan.service_time}
            />
            <Field
              label="Lugar"
              name="location"
              defaultValue={plan.location}
            />
            <Field
              label="Predicador"
              name="preacher"
              defaultValue={plan.preacher ?? ""}
            />
            <Field label="Tema" name="theme" defaultValue={plan.theme ?? ""} />
          </div>

          <TextArea
            label="Versículo"
            name="verse"
            defaultValue={plan.verse ?? ""}
          />

          <TextArea
            label="Notas"
            name="notes"
            defaultValue={plan.notes ?? ""}
          />

          <SelectStatus defaultValue={plan.status} />

          <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
            Guardar servicio
          </button>
        </form>

                <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Equipos
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Editar equipos
            </h2>
          </div>

          {teams.map((team, index) => {
            const memberCount = team.members?.length ?? 0;
            const teamAssignments = assignmentsByTeam.get(team.id) ?? [];

            return (
              <details
                key={team.id}
                open={index === 0}
                className="group overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-xl">
                      {team.emoji || "🤝"}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-stone-950">
                        {team.team_name}
                      </h3>

                      <p className="text-sm text-stone-500">
                        {team.leader_name
                          ? `Responsable: ${team.leader_name}`
                          : "Pendiente de asignar"}{" "}
                        · {memberCount} integrantes
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      team.status
                    )}`}
                  >
                    {getStatusLabel(team.status)}
                  </span>
                </summary>

                <form
                  action={updateServiceTeam}
                  className="space-y-4 border-t border-stone-100 bg-stone-50 p-5"
                >
                  <input type="hidden" name="id" defaultValue={team.id} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Nombre del equipo"
                      name="team_name"
                      defaultValue={team.team_name}
                    />

                    <Field
                      label="Emoji"
                      name="emoji"
                      defaultValue={team.emoji ?? ""}
                    />

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Responsable
                      </span>

                      <select
                        name="leader_name"
                        defaultValue={team.leader_name ?? ""}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
                      >
                        <option value="">Pendiente de asignar</option>
                        {profiles.map((profile) => (
                          <option key={profile.id} value={profile.full_name}>
                            {profile.full_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Field
                      label="Hora de llegada"
                      name="arrival_time"
                      defaultValue={team.arrival_time ?? ""}
                    />

                    <Field
                      label="Hora de servicio"
                      name="service_time"
                      defaultValue={team.service_time ?? ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Integrantes
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {profiles.map((profile) => {
                        const checked = (team.members ?? []).includes(
                          profile.full_name
                        );

                        return (
                          <label
                            key={profile.id}
                            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
                          >
                            <input
                              type="checkbox"
                              name="members"
                              value={profile.full_name}
                              defaultChecked={checked}
                              className="h-4 w-4"
                            />
                            {profile.full_name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <TextArea
                    label="Checklist"
                    name="checklist"
                    defaultValue={(team.checklist ?? []).join("\n")}
                    placeholder="Una tarea por línea"
                  />

                  <SelectStatus defaultValue={team.status} />

                  <div className="rounded-[24px] border border-stone-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Respuestas del equipo
                    </p>

                    {teamAssignments.length === 0 ? (
                      <p className="mt-2 text-sm leading-6 text-stone-500">
                        Todavía no hay respuestas registradas para este equipo.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {teamAssignments.map((assignment) => {
                          const profile = profileById.get(
                            assignment.profile_id
                          );

                          return (
                            <div
                              key={assignment.id}
                              className="rounded-2xl border border-stone-100 bg-stone-50 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-stone-950">
                                    {profile?.full_name ||
                                      "Persona no encontrada"}
                                  </p>

                                  {profile?.phone ? (
                                    <p className="text-xs text-stone-500">
                                      {profile.phone}
                                    </p>
                                  ) : null}
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getResponseClass(
                                    assignment.status
                                  )}`}
                                >
                                  {getResponseLabel(assignment.status)}
                                </span>
                              </div>

                              {assignment.note ? (
                                <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-stone-600">
                                  {assignment.note}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
                    Guardar equipo
                  </button>
                </form>
              </details>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      />
    </label>
  );
}

function SelectStatus({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Estado
      </span>
      <select
        name="status"
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      >
        <option value="pending">Por confirmar</option>
        <option value="ready">Confirmado</option>
        <option value="attention">Revisar</option>
      </select>
    </label>
  );
}