import { getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";
import {
  getCotizacionById,
  getPerfilByCorreo,
  mapCotizacionForSeguimiento,
  updateCotizacionEstatus,
} from "@/lib/supabase/cotizaciones";
import { COTIZACIONES, ESTATUS } from "@/lib/supabase/schema";

const ALLOWED_STATUSES = new Set([ESTATUS.PENDIENTE, ESTATUS.CERRADA]);

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const { id } = await params;

  try {
    const cotizacion = await getCotizacionById(id);
    if (!cotizacion) {
      return jsonResponse({ error: "Cotizacion no encontrada." }, 404);
    }

    const perfil = await getPerfilByCorreo(user.email);
    const isOwner = perfil?.id && cotizacion[COTIZACIONES.VENDEDOR_ID] === perfil.id;

    if (user.role === "admin") {
      return jsonResponse(
        { error: "La direccion no puede cambiar el estatus. Solo el vendedor en Seguimiento." },
        403
      );
    }

    if (!isOwner) {
      return jsonResponse({ error: "No autorizado." }, 403);
    }

    const body = await request.json();
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!ALLOWED_STATUSES.has(status)) {
      return jsonResponse({ error: "Estatus invalido." }, 400);
    }

    const updated = await updateCotizacionEstatus(id, status);
    return jsonResponse({ quote: mapCotizacionForSeguimiento(updated) });
  } catch (error) {
    console.error("Update quote error:", error);
    return jsonResponse(
      { error: error.message || "No fue posible actualizar la cotizacion." },
      500
    );
  }
}
