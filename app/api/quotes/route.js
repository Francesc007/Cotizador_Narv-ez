import { getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";
import {
  getPerfilByCorreo,
  insertCotizacion,
  listCotizacionesByVendedor,
} from "@/lib/supabase/cotizaciones";
import { COTIZACIONES } from "@/lib/supabase/schema";

function resolveEmpresaId(sessionUser, perfil) {
  if (perfil?.empresa_id) {
    return perfil.empresa_id;
  }

  if (sessionUser.empresa && sessionUser.empresa !== "all") {
    return sessionUser.empresa;
  }

  return null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  try {
    const perfil = await getPerfilByCorreo(user.email);
    if (!perfil?.id) {
      return jsonResponse({ quotes: [] });
    }

    const quotes = await listCotizacionesByVendedor(perfil.id);
    return jsonResponse({ quotes });
  } catch (error) {
    console.error("List quotes error:", error);
    return jsonResponse(
      { error: error.message || "No fue posible cargar las cotizaciones." },
      500
    );
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  try {
    const body = await request.json();

    const cliente = typeof body.cliente === "string" ? body.cliente.trim() : "";
    const cp = typeof body.cp === "string" ? body.cp.trim() : "";
    const solicitante = typeof body.solicitante === "string" ? body.solicitante.trim() : "";
    const resistencia = typeof body.resistencia === "string" ? body.resistencia : "";
    const edad = typeof body.edad === "string" ? body.edad : "";
    const revenimiento = typeof body.revenimiento === "string" ? body.revenimiento : "";
    const aditivo = typeof body.aditivo === "string" ? body.aditivo : "Ninguno";
    const whatsappCliente =
      typeof body.whatsappCliente === "string" ? body.whatsappCliente.replace(/\D/g, "") : "";
    const volumen = Number(body.volumen);
    const discountPercent = Number(body.discountPercent) || 0;
    const priceModel = body.priceModel ?? {};

    if (!cliente) {
      return jsonResponse({ error: "El nombre del cliente es obligatorio." }, 400);
    }

    if (whatsappCliente.length !== 10) {
      return jsonResponse({ error: "El WhatsApp del cliente debe tener 10 digitos." }, 400);
    }

    if (!cp) {
      return jsonResponse({ error: "El codigo postal es obligatorio." }, 400);
    }

    if (!Number.isFinite(volumen) || volumen <= 0) {
      return jsonResponse({ error: "El volumen de la cotizacion no es valido." }, 400);
    }

    const subtotal = Number(priceModel.subtotal);
    const iva = Number(priceModel.iva);
    const total = Number(priceModel.total);

    if (!Number.isFinite(total) || total <= 0) {
      return jsonResponse({ error: "El total de la cotizacion no es valido." }, 400);
    }

    const perfil = await getPerfilByCorreo(user.email);
    if (!perfil?.id) {
      return jsonResponse(
        {
          error:
            "No hay perfil en Supabase para este correo. Crea el usuario en Auth y un registro en perfiles_usuarios.",
        },
        400
      );
    }

    const empresaId = resolveEmpresaId(user, perfil);
    if (!empresaId) {
      return jsonResponse(
        { error: "La direccion no puede guardar cotizaciones sin una planta asignada." },
        400
      );
    }

    const cotizacion = await insertCotizacion({
      empresaId,
      vendedorId: perfil.id,
      cliente,
      solicitante,
      whatsappCliente,
      cp,
      volumen,
      resistencia,
      edad,
      revenimiento,
      aditivo,
      bombaEstacionaria: Boolean(body.bombaEstacionaria),
      bombaPluma: Boolean(body.bombaPluma),
      domingo: Boolean(body.domingo),
      nocturno: Boolean(body.nocturno),
      discountPercent,
      priceModel: { subtotal, iva, total },
    });

    return jsonResponse(
      {
        quote: {
          id: cotizacion[COTIZACIONES.ID],
          folio_institucional: cotizacion[COTIZACIONES.FOLIO_INSTITUCIONAL],
          folio_consecutivo: cotizacion[COTIZACIONES.FOLIO_CONSECUTIVO],
          estatus: cotizacion[COTIZACIONES.ESTATUS],
          total: cotizacion[COTIZACIONES.TOTAL],
          creado_at: cotizacion[COTIZACIONES.CREADO_AT],
        },
      },
      201
    );
  } catch (error) {
    console.error("Create quote error:", error);
    return jsonResponse(
      { error: error.message || "No fue posible guardar la cotizacion." },
      500
    );
  }
}
