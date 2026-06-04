import { getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";
import {
  deleteCotizacion,
  getCotizacionById,
  getPerfilByCorreo,
  mapCotizacionForSeguimiento,
  updateCotizacionEstatus,
} from "@/lib/supabase/cotizaciones";
import { COTIZACIONES, ESTATUS, normalizeCotizacionEstatus } from "@/lib/supabase/schema";

const ALLOWED_STATUSES = new Set([ESTATUS.PENDIENTE, ESTATUS.CERRADA]);

export async function DELETE(_request, { params }) {
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

    if (!isOwner) {
      return jsonResponse({ error: "No autorizado." }, 403);
    }

    if (normalizeCotizacionEstatus(cotizacion[COTIZACIONES.ESTATUS]) !== ESTATUS.PENDIENTE) {
      return jsonResponse(
        { error: "Solo se puede cancelar una cotizacion pendiente." },
        400
      );
    }

    await deleteCotizacion(id);
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Delete quote error:", error);
    return jsonResponse(
      { error: error.message || "No fue posible cancelar la cotizacion." },
      500
    );
  }
}

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

    if (!isOwner) {
      return jsonResponse(
        {
          error:
            user.role === "admin"
              ? "Solo puedes cambiar el estatus de cotizaciones que tu emitiste."
              : "No autorizado.",
        },
        403
      );
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
