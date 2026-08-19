"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Save,
  Users,
} from "lucide-react";

import { saveServiceAssignmentsAction } from "./actions";

type Profile = {
  id: string;
  fullName: string;
  positionTitle: string | null;
  ministries: string[];
};

type Team = {
  id: string;
  teamName: string;
  emoji: string | null;
  assignedProfileIds: string[];
};

type Props = {
  servicePlanId: string;
  teams: Team[];
  profiles: Profile[];
};

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX");
}

export default function AssignmentManager({
  servicePlanId,
  teams,
  profiles,
}: Props) {
  const initialAssignments = useMemo(
    () =>
      Object.fromEntries(
        teams.map((team) => [
          team.id,
          team.assignedProfileIds,
        ])
      ),
    [teams]
  );

  const [assignments, setAssignments] =
    useState<Record<string, string[]>>(
      initialAssignments
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  function toggleProfile(
    teamId: string,
    profileId: string
  ) {
    setAssignments((current) => {
      const currentIds =
        current[teamId] ?? [];

      const exists =
        currentIds.includes(profileId);

      return {
        ...current,
        [teamId]: exists
          ? currentIds.filter(
              (id) => id !== profileId
            )
          : [...currentIds, profileId],
      };
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);

    const result =
      await saveServiceAssignmentsAction(
        servicePlanId,
        teams.map((team) => ({
          teamId: team.id,
          profileIds:
            assignments[team.id] ?? [],
        }))
      );

    setSaving(false);

    if (!result.success) {
      setMessage(
        result.error ||
          "No se pudieron guardar las asignaciones."
      );
      return;
    }

    setMessage(
      "Asignaciones guardadas correctamente."
    );
  }

  return (
    <div className="space-y-5">
      {teams.map((team) => {
        const teamProfiles =
          profiles.filter((profile) =>
            profile.ministries.some(
              (ministry) =>
                normalize(ministry) ===
                normalize(team.teamName)
            )
          );

        const selected =
          assignments[team.id] ?? [];

        return (
          <section
            key={team.id}
            className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl">
                  {team.emoji || "🤝"}
                </p>

                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  {team.teamName}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {selected.length} asignado
                  {selected.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <Users size={20} />
              </div>
            </div>

            {teamProfiles.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
                No hay perfiles registrados en este
                ministerio.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {teamProfiles.map(
                  (profile) => {
                    const checked =
                      selected.includes(
                        profile.id
                      );

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() =>
                          toggleProfile(
                            team.id,
                            profile.id
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                          checked
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-200 bg-white text-stone-950 hover:bg-stone-50"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">
                            {profile.fullName}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              checked
                                ? "text-white/60"
                                : "text-stone-500"
                            }`}
                          >
                            {profile.positionTitle ||
                              "Servidor"}
                          </p>
                        </div>

                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            checked
                              ? "bg-white text-stone-950"
                              : "border border-stone-300"
                          }`}
                        >
                          {checked ? (
                            <Check size={16} />
                          ) : null}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>
        );
      })}

      {message ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-medium text-stone-700">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 font-semibold text-white disabled:opacity-60"
      >
        {saving ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <Save size={18} />
        )}

        {saving
          ? "Guardando..."
          : "Guardar asignaciones"}
      </button>
    </div>
  );
}