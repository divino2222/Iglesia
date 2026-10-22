import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/*
 * Refresca la sesión de Supabase en cada petición
 * para que los Server Components reciban un JWT vigente.
 *
 * No decide permisos: eso lo hacen requireAccess /
 * requirePermission en cada página.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todo excepto archivos estáticos, service worker,
     * manifiesto e imágenes / datos públicos.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|images/|videos/|sounds/|data/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4|json)$).*)",
  ],
};
