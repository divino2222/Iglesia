import { requireAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  position_title: string | null;
  ministries: string[] | null;
  ministry_scope: string[] | null;
  is_active: boolean;
  birth_date: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joined_at: string | null;
  bio: string | null;
};

function formatList(
  values: string[] | null | undefined
) {
  if (!Array.isArray(values) || values.length === 0) {
    return "Sin ministerio asignado";
  }

  return values.join(", ");
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Sin fecha registrada";
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PerfilPage() {
  const access = await requireAccess();

  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      position_title,
      ministries,
      ministry_scope,
      is_active,
      birth_date,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      joined_at,
      bio
    `)
    .eq("id", access.profileId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo cargar tu perfil: ${error.message}`
    );
  }

  const profile =
    data as ProfileRow | null;

  if (!profile) {
    throw new Error(
      "No se encontró el perfil asociado a tu cuenta."
    );
  }

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <section className="overflow-hidden rounded-[34px] bg-stone-950 text-white shadow-sm">
          <div className="p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Mi perfil
            </p>

            <div className="mt-5 flex items-center gap-4">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="h-16 w-16 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-xl font-semibold">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold">
                  {profile.full_name}
                </h1>

                <p className="mt-1 text-sm text-white/60">
                  {access.roleLabel}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  {profile.position_title ||
                    "Sin cargo registrado"}
                </p>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-5 text-sm leading-6 text-white/65">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Información personal
              </p>

              <h2 className="mt-1 text-lg font-semibold text-stone-950">
                Tus datos
              </h2>
            </div>

            <a
              href="/perfil/editar"
              className="rounded-2xl bg-stone-950 px-4 py-2.5 text-xs font-semibold text-white"
            >
              Editar perfil
            </a>
          </div>

          <div className="mt-5 space-y-4">
            <ProfileField
              label="Nombre"
              value={profile.full_name}
            />

            <ProfileField
              label="Correo"
              value={
                profile.email ||
                access.email
              }
            />

            <ProfileField
              label="Teléfono"
              value={
                profile.phone ||
                "Sin teléfono registrado"
              }
            />

            <ProfileField
              label="Fecha de nacimiento"
              value={formatDate(
                profile.birth_date
              )}
            />

            <ProfileField
              label="Domicilio"
              value={
                profile.address ||
                "Sin domicilio registrado"
              }
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Contacto de emergencia
          </p>

          <div className="mt-4 space-y-4">
            <ProfileField
              label="Nombre"
              value={
                profile.emergency_contact_name ||
                "Sin contacto registrado"
              }
            />

            <ProfileField
              label="Teléfono"
              value={
                profile.emergency_contact_phone ||
                "Sin teléfono registrado"
              }
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Servicio
          </p>

          <div className="mt-4 space-y-4">
            <ProfileField
              label="Rol"
              value={access.roleLabel}
            />

            <ProfileField
              label="Cargo"
              value={
                profile.position_title ||
                "Sin cargo registrado"
              }
            />

            <ProfileField
              label="Ministerios"
              value={formatList(
                profile.ministries
              )}
            />

            {access.ministryScope.length >
            0 ? (
              <ProfileField
                label="Ámbito de responsabilidad"
                value={access.ministryScope.join(
                  ", "
                )}
              />
            ) : null}

            <ProfileField
              label="Estado"
              value={
                profile.is_active
                  ? "Activo"
                  : "Inactivo"
              }
            />

            <ProfileField
              label="Integración a Comunidad VID"
              value={formatDate(
                profile.joined_at
              )}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Cuenta
          </p>

          <div className="mt-4 space-y-4">
            <ProfileField
              label="Correo de acceso"
              value={access.email}
            />

            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                Seguridad
              </p>

              <p className="mt-1 text-sm font-medium text-stone-900">
                Rol, ministerios y permisos son administrados por Comunidad VID.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium leading-6 text-stone-900">
        {value}
      </p>
    </div>
  );
}