"use client";

import {
  useState,
} from "react";
import {
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { updateOwnProfileAction } from "./actions";

type Props = {
  initialValues: {
    fullName: string;
    email: string;
    phone: string;
    photoUrl: string;
    birthDate: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    bio: string;
  };
};

export default function EditProfileForm({
  initialValues,
}: Props) {
  const router = useRouter();

  const [phone, setPhone] =
    useState(initialValues.phone);

  const [photoUrl, setPhotoUrl] =
    useState(initialValues.photoUrl);

  const [
    birthDate,
    setBirthDate,
  ] = useState(
    initialValues.birthDate
  );

  const [address, setAddress] =
    useState(initialValues.address);

  const [
    emergencyContactName,
    setEmergencyContactName,
  ] = useState(
    initialValues.emergencyContactName
  );

  const [
    emergencyContactPhone,
    setEmergencyContactPhone,
  ] = useState(
    initialValues.emergencyContactPhone
  );

  const [bio, setBio] =
    useState(initialValues.bio);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  async function saveProfile() {
    setLoading(true);
    setMessage(null);

    const result =
      await updateOwnProfileAction({
        phone,
        photoUrl,
        birthDate,
        address,
        emergencyContactName,
        emergencyContactPhone,
        bio,
      });

    setLoading(false);

    if (!result.success) {
      setMessage(
        result.error ||
          "No se pudo guardar el perfil."
      );
      return;
    }

    router.push("/perfil");
    router.refresh();
  }

  return (
    <section className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-stone-700">
            Nombre
          </label>

          <input
            value={initialValues.fullName}
            disabled
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-100 px-4 text-sm text-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Correo
          </label>

          <input
            value={initialValues.email}
            disabled
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-100 px-4 text-sm text-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Teléfono
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
            placeholder="Ej. 5512345678"
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Fecha de nacimiento
          </label>

          <input
            type="date"
            value={birthDate}
            onChange={(event) =>
              setBirthDate(
                event.target.value
              )
            }
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Domicilio
          </label>

          <textarea
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value
              )
            }
            placeholder="Calle, número, colonia, alcaldía o municipio..."
            className="mt-2 min-h-[100px] w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Contacto de emergencia
          </label>

          <input
            value={
              emergencyContactName
            }
            onChange={(event) =>
              setEmergencyContactName(
                event.target.value
              )
            }
            placeholder="Nombre completo"
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Teléfono de emergencia
          </label>

          <input
            type="tel"
            value={
              emergencyContactPhone
            }
            onChange={(event) =>
              setEmergencyContactPhone(
                event.target.value
              )
            }
            placeholder="Ej. 5512345678"
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Sobre mí
          </label>

          <textarea
            value={bio}
            onChange={(event) =>
              setBio(
                event.target.value
              )
            }
            placeholder="Cuéntanos un poco sobre ti..."
            maxLength={300}
            className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500"
          />

          <p className="mt-1 text-right text-[11px] text-stone-400">
            {bio.length}/300
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">
            Foto de perfil
          </label>

          <input
            value={photoUrl}
            onChange={(event) =>
              setPhotoUrl(
                event.target.value
              )
            }
            placeholder="URL de la fotografía"
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-stone-500"
          />

          <p className="mt-2 text-xs leading-5 text-stone-500">
            Por ahora usaremos una URL para comprobar
            el flujo. Después conectaremos carga directa
            de fotografías a Supabase Storage.
          </p>

          {photoUrl ? (
            <div className="mt-4">
              <img
                src={photoUrl}
                alt="Vista previa"
                className="h-24 w-24 rounded-3xl border border-stone-200 object-cover"
              />
            </div>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={saveProfile}
          disabled={loading}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          Guardar cambios
        </button>
      </div>
    </section>
  );
}