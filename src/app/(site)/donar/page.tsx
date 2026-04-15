import Link from "next/link";
import {
  HandCoins,
  HeartHandshake,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

export default async function DonarPage() {
  const churchInfo = await getChurchInfo();
  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, me gustaría recibir información para donar en ${churchName}.`
  )}`;

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Generosidad
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
          Donar
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Tu generosidad ayuda a fortalecer la obra, servir a personas y seguir
          construyendo comunidad.
        </p>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
          <div
            className="relative h-56"
            style={{
              backgroundImage: `url(${churchMedia.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <HandCoins size={20} />
              </div>

              <h2 className="mt-4 text-2xl font-semibold">
                Apoya con generosidad
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Si deseas apoyar a {churchName}, escríbenos y te compartiremos la
                información correspondiente.
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="mt-1">
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
              >
                <MessageCircle size={16} />
                Solicitar información
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <HeartHandshake size={12} />
                  Generosidad con propósito
                </div>
                <p className="text-sm leading-7 text-stone-700">
                  Cada aporte ayuda a sostener actividades, atención a personas y
                  espacios de comunidad.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  <ShieldCheck size={12} />
                  Proceso claro
                </div>
                <p className="text-sm leading-7 text-stone-700">
                  La información se comparte de forma directa y clara por WhatsApp
                  para acompañarte en el proceso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}