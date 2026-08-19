import Link from "next/link";

import { requireAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

import EditProfileForm from "./edit-profile-form";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  birth_date: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bio: string | null;
};

export default async function EditProfilePage() {
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
      birth_date,
      address,
      emergency_contact_name,
      emergency_contact_phone,
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

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <section className="rounded-[34px] bg-stone-950 p-6 text-white shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Mi perfil
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            Editar información
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/60">
            Puedes actualizar tus datos personales.
            Tu rol, ministerio, cargo y permisos
            son administrados por Comunidad VID.
          </p>
        </section>

        <EditProfileForm
          initialValues={{
            fullName:
              profile.full_name,
            email:
              profile.email ||
              access.email,
            phone:
              profile.phone || "",
            photoUrl:
              profile.photo_url || "",
            birthDate:
              profile.birth_date || "",
            address:
              profile.address || "",
            emergencyContactName:
              profile.emergency_contact_name ||
              "",
            emergencyContactPhone:
              profile.emergency_contact_phone ||
              "",
            bio:
              profile.bio || "",
          }}
        />

        <Link
          href="/perfil"
          className="flex h-12 items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm"
        >
          Volver a Mi Perfil
        </Link>
      </div>
    </main>
  );
}