import { getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";
import { createQuote, listQuotes } from "@/lib/quotes/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const quotes = await listQuotes();
  const filtered =
    user.role === "admin"
      ? quotes
      : quotes.filter((quote) => quote.vendedorEmail === user.email);

  return jsonResponse({ quotes: filtered });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  try {
    const body = await request.json();
    const cliente = typeof body.cliente === "string" ? body.cliente.trim() : "";

    if (!cliente) {
      return jsonResponse({ error: "El nombre del cliente es obligatorio." }, 400);
    }

    const total = Number(body.total);
    const volumen = Number(body.volumen);

    if (!Number.isFinite(total) || total <= 0) {
      return jsonResponse({ error: "El total de la cotizacion no es valido." }, 400);
    }

    if (!Number.isFinite(volumen) || volumen <= 0) {
      return jsonResponse({ error: "El volumen de la cotizacion no es valido." }, 400);
    }

    const quote = await createQuote({
      cliente,
      solicitante: typeof body.solicitante === "string" ? body.solicitante.trim() : "",
      cp: typeof body.cp === "string" ? body.cp.trim() : "",
      volumen,
      resistencia: typeof body.resistencia === "string" ? body.resistencia : "",
      total,
      vendedorEmail: user.email,
      vendedorNombre: user.name,
    });

    return jsonResponse({ quote }, 201);
  } catch (error) {
    console.error("Create quote error:", error);
    return jsonResponse({ error: "No fue posible guardar la cotizacion." }, 500);
  }
}
