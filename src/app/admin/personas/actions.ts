"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";

function parseList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeList(value: string[] | null | undefined) {
  return [...(value ?? [])]
    .map((item) => item.trim())
    .filter(Boolean)
    .sort();
}

function listsAreEqual(
  previous: string[] | null | undefined,
  current: string[]
) {
  return (
    JSON.stringify(normalizeList(previous)) ===
    JSON.stringify(normalizeList(current))
  );
}

function revalidateProfilePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/personas");
  revalidatePath("/admin/servir");
  revalidatePath("/servir");
  revalidatePath("/mi-servicio");
}

export async function createProfile(formData: FormData) {
  const supabase = createAdminClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const photoUrl = String(formData.get("photo_url") || "").trim();
  const role = String(formData.get("role") || "servidor").trim();
  const ministries = parseList(
    String(formData.get("ministries") || "")
  );

  if (!fullName) {
    throw new Error("El nombre completo es obligatorio.");
  }

  if (email) {
    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("email", email)
        .maybeSingle();

    if (existingProfileError) {
      throw new Error(
        `No se pudo verificar el correo: ${existingProfileError.message}`
      );
    }

    if (existingProfile) {
      throw new Error(
        `Ya existe una persona registrada con el correo ${email}.`
      );
    }
  }

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      photo_url: photoUrl || null,
      role,
      ministries,
      is_active: true,
    })
    .select(
      "id, full_name, email, phone, photo_url, role, ministries, is_active"
    )
    .single();

  if (error || !createdProfile) {
    throw new Error(
      `Error creando persona: ${
        error?.message || "No se creó el registro."
      }`
    );
  }

  await logActivity({
    action: "created_profile",
    entityType: "profile",
    entityId: createdProfile.id,
    profileId: createdProfile.id,
    actorName: "Coordinación",
    description: `Coordinación agregó a ${createdProfile.full_name} al directorio de personas.`,
    metadata: {
      full_name: createdProfile.full_name,
      email: createdProfile.email,
      phone: createdProfile.phone,
      role: createdProfile.role,
      ministries: createdProfile.ministries ?? [],
      is_active: createdProfile.is_active,
    },
  });

  revalidateProfilePaths();
}

export async function updateProfile(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Falta identificar a la persona.");
  }

  const { data: previousProfile, error: previousProfileError } =
    await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, photo_url, role, ministries, is_active"
      )
      .eq("id", id)
      .single();

  if (previousProfileError || !previousProfile) {
    throw new Error(
      `No se pudo consultar el perfil: ${
        previousProfileError?.message || "Perfil no encontrado."
      }`
    );
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const photoUrl = String(formData.get("photo_url") || "").trim();
  const role = String(formData.get("role") || "miembro").trim();
  const ministries = parseList(
    String(formData.get("ministries") || "")
  );
  const isActive = formData.get("is_active") === "on";

  if (!fullName) {
    throw new Error("El nombre completo es obligatorio.");
  }

  if (email) {
    const { data: duplicateProfile, error: duplicateError } =
      await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("email", email)
        .neq("id", id)
        .maybeSingle();

    if (duplicateError) {
      throw new Error(
        `No se pudo verificar el correo: ${duplicateError.message}`
      );
    }

    if (duplicateProfile) {
      throw new Error(
        `El correo ${email} ya pertenece a ${duplicateProfile.full_name}.`
      );
    }
  }

  const updatedValues = {
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    photo_url: photoUrl || null,
    role,
    ministries,
    is_active: isActive,
  };

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(updatedValues)
    .eq("id", id)
    .select(
      "id, full_name, email, phone, photo_url, role, ministries, is_active"
    )
    .single();

  if (error || !updatedProfile) {
    throw new Error(
      `Error actualizando persona: ${
        error?.message || "No se actualizó el registro."
      }`
    );
  }

  const changedFields: string[] = [];

  if (previousProfile.full_name !== updatedProfile.full_name) {
    changedFields.push("nombre");
  }

  if (
    (previousProfile.email ?? null) !==
    (updatedProfile.email ?? null)
  ) {
    changedFields.push("correo");
  }

  if (
    (previousProfile.phone ?? null) !==
    (updatedProfile.phone ?? null)
  ) {
    changedFields.push("teléfono");
  }

  if (
    (previousProfile.photo_url ?? null) !==
    (updatedProfile.photo_url ?? null)
  ) {
    changedFields.push("foto");
  }

  if (previousProfile.role !== updatedProfile.role) {
    changedFields.push("rol");
  }

  if (
    !listsAreEqual(
      previousProfile.ministries,
      updatedProfile.ministries ?? []
    )
  ) {
    changedFields.push("ministerios");
  }

  if (previousProfile.is_active !== updatedProfile.is_active) {
    changedFields.push("estado");
  }

  if (changedFields.length > 0) {
    await logActivity({
      action: "updated_profile",
      entityType: "profile",
      entityId: updatedProfile.id,
      profileId: updatedProfile.id,
      actorName: "Coordinación",
      description: `Coordinación actualizó ${changedFields.join(
        ", "
      )} de ${updatedProfile.full_name}.`,
      metadata: {
        changed_fields: changedFields,
        previous: {
          full_name: previousProfile.full_name,
          email: previousProfile.email,
          phone: previousProfile.phone,
          photo_url: previousProfile.photo_url,
          role: previousProfile.role,
          ministries: previousProfile.ministries ?? [],
          is_active: previousProfile.is_active,
        },
        current: {
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          photo_url: updatedProfile.photo_url,
          role: updatedProfile.role,
          ministries: updatedProfile.ministries ?? [],
          is_active: updatedProfile.is_active,
        },
      },
    });
  }

  revalidateProfilePaths();
}