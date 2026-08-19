"use server";

import { revalidatePath } from "next/cache";

import { requireAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdateProfileInput = {
  phone: string;
  birthDate: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bio: string;
  photoUrl: string;
};

export async function updateOwnProfileAction(
  input: UpdateProfileInput
) {
  const access = await requireAccess();

  const admin = createAdminClient();

  const cleanPhone =
    input.phone.trim() || null;

  const cleanAddress =
    input.address.trim() || null;

  const cleanEmergencyName =
    input.emergencyContactName.trim() ||
    null;

  const cleanEmergencyPhone =
    input.emergencyContactPhone.trim() ||
    null;

  const cleanBio =
    input.bio.trim() || null;

  const cleanPhotoUrl =
    input.photoUrl.trim() || null;

  const cleanBirthDate =
    input.birthDate.trim() || null;

  const {
    error,
  } = await admin
    .from("profiles")
    .update({
      phone: cleanPhone,
      birth_date: cleanBirthDate,
      address: cleanAddress,
      emergency_contact_name:
        cleanEmergencyName,
      emergency_contact_phone:
        cleanEmergencyPhone,
      bio: cleanBio,
      photo_url: cleanPhotoUrl,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", access.profileId);

  if (error) {
    return {
      success: false,
      error:
        "No se pudo actualizar el perfil: " +
        error.message,
    };
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");

  return {
    success: true,
  };
}