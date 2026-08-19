import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProfile, updateProfile } from "./actions";

type PageProps = {
  searchParams?: Promise<{
    pin?: string;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: string;
  ministries: string[] | null;
  is_active: boolean;
};

export default async function AdminPersonasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pin = params?.pin;
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
            /admin/personas?pin=TU_PIN
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Panel privado
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-stone-950">
            Personas
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Administra servidores, coordinadores, ministerios, teléfonos y
            datos principales.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/admin/servir?pin=${encodeURIComponent(pin || "")}`}
              className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Volver a Servir
            </Link>
          </div>
        </section>

        <form
          action={createProfile}
          className="space-y-4 rounded-[34px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Nuevo registro
          </p>

          <h2 className="text-xl font-semibold text-stone-950">
            Agregar persona
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre completo" name="full_name" />
            <Field label="Teléfono" name="phone" />
            <Field label="Correo" name="email" type="email" />
            <Field label="Foto URL" name="photo_url" />
          </div>

          <SelectRole defaultValue="servidor" />

          <TextArea
            label="Ministerios"
            name="ministries"
            placeholder={"Alabanza\nMultimedia"}
          />

          <button className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
            Crear persona
          </button>
        </form>

        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Directorio
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Personas registradas
            </h2>
          </div>

          {profiles.map((profile, index) => (
            <details
              key={profile.id}
              open={index === 0}
              className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 bg-cover bg-center text-sm font-bold text-stone-700"
                    style={
                      profile.photo_url
                        ? { backgroundImage: `url(${profile.photo_url})` }
                        : undefined
                    }
                  >
                    {!profile.photo_url
                      ? profile.full_name.slice(0, 1).toUpperCase()
                      : null}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">
                      {profile.full_name}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {profile.role} ·{" "}
                      {profile.is_active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {profile.is_active ? "Activo" : "Inactivo"}
                </span>
              </summary>

              <form
                action={updateProfile}
                className="space-y-4 border-t border-stone-100 bg-stone-50 p-5"
              >
                <input type="hidden" name="id" defaultValue={profile.id} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Nombre completo"
                    name="full_name"
                    defaultValue={profile.full_name}
                  />
                  <Field
                    label="Teléfono"
                    name="phone"
                    defaultValue={profile.phone ?? ""}
                  />
                  <Field
                    label="Correo"
                    name="email"
                    type="email"
                    defaultValue={profile.email ?? ""}
                  />
                  <Field
                    label="Foto URL"
                    name="photo_url"
                    defaultValue={profile.photo_url ?? ""}
                  />
                </div>

                <SelectRole defaultValue={profile.role} />

                <TextArea
                  label="Ministerios"
                  name="ministries"
                  defaultValue={(profile.ministries ?? []).join("\n")}
                  placeholder={"Alabanza\nMultimedia"}
                />

                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={profile.is_active}
                    className="h-4 w-4"
                  />
                  Persona activa
                </label>

                <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
                  Guardar persona
                </button>
              </form>
            </details>
          ))}
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
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

function SelectRole({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Rol
      </span>
      <select
        name="role"
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
      >
        <option value="pastor">Pastor</option>
        <option value="administrador">Administrador</option>
        <option value="coordinador">Coordinador</option>
        <option value="servidor">Servidor</option>
        <option value="miembro">Miembro</option>
        <option value="invitado">Invitado</option>
      </select>
    </label>
  );
}