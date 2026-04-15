import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";
import ContactForm from "@/components/forms/contact-form";
import { getChurchInfo } from "@/lib/church-info";

export default async function ContactPage() {
  const churchInfo = await getChurchInfo();

  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";
  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría recibir información de ${churchName}.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Contacto
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Estamos para ayudarte. Envíanos tu mensaje y con gusto te responderemos.
        </p>
      </div>

      <div className="mb-5 grid gap-3">
        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
            <Mail size={18} className="text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Escríbenos</p>
            <p className="mt-1 text-sm text-stone-600">
              Déjanos tus datos y tu mensaje.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
            <MessageCircle size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Atención cercana</p>
            <p className="mt-1 text-sm text-stone-600">
              Queremos acompañarte y responderte con claridad.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
            <Phone size={18} className="text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Conecta con nosotros</p>
            <p className="mt-1 text-sm text-stone-600">
              Usa este formulario para cualquier duda o seguimiento.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
            <MessageCircle size={18} className="text-emerald-700" />
          </div>

          <div className="flex-1">
            <p className="text-base font-semibold text-stone-900">
              Escríbenos por WhatsApp
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Si prefieres una atención más directa, también puedes contactarnos por WhatsApp.
            </p>

            <Link
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MessageCircle size={18} />
              Abrir WhatsApp
            </Link>
          </div>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}