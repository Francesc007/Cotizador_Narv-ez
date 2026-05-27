import { getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";
import { getQuoteById, updateQuoteStatus } from "@/lib/quotes/store";

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const { id } = await params;
  const quote = await getQuoteById(id);

  if (!quote) {
    return jsonResponse({ error: "Cotizacion no encontrada." }, 404);
  }

  if (user.role !== "admin" && quote.vendedorEmail !== user.email) {
    return jsonResponse({ error: "No autorizado." }, 403);
  }

  try {
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (status !== "Pendiente" && status !== "Cerrada") {
      return jsonResponse({ error: "Estatus invalido." }, 400);
    }

    const updated = await updateQuoteStatus(id, status);
    return jsonResponse({ quote: updated });
  } catch (error) {
    console.error("Update quote error:", error);
    return jsonResponse({ error: "No fue posible actualizar la cotizacion." }, 500);
  }
}
