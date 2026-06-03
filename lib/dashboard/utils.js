import { EMPRESA_IDS, ESTATUS, normalizeCotizacionEstatus } from "@/lib/supabase/schema";

export const LEADERBOARD_PAGE_SIZE = 5;
export const VENDOR_CHART_TOP_LIMIT = 5;
/** 5 por pagina × 3 paginas = 15 ejemplos en demo de recientes. */
export const DASHBOARD_RECENT_QUOTES_PAGE_SIZE = 5;
export const DASHBOARD_MOCK_RECENT_QUOTES_LIMIT = 15;

const PLANTA_LABELS = {
  [EMPRESA_IDS.NARVAEZ]: "Narvaez",
  [EMPRESA_IDS.TEPEXI]: "Tepexi",
};

export function getPlantaLabel(empresaId) {
  return PLANTA_LABELS[empresaId] ?? "—";
}

/** Mismos tonos que los botones de filtro del panel de gerencia. */
export function getPlantaBadgeClass(empresaId) {
  if (empresaId === EMPRESA_IDS.TEPEXI) {
    return "border-[#103a6b] bg-[#103a6b]/10 text-[#103a6b]";
  }

  if (empresaId === EMPRESA_IDS.NARVAEZ) {
    return "border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]";
  }

  return "border-slate-300 bg-slate-100 text-slate-600";
}

const MS_IN_24_HOURS = 24 * 60 * 60 * 1000;

export function isQuoteInLast24Hours(creadoAt) {
  if (!creadoAt) return false;

  const quoteTime = new Date(creadoAt).getTime();
  if (Number.isNaN(quoteTime)) return false;

  return Date.now() - quoteTime <= MS_IN_24_HOURS;
}

/** Cotizaciones mas recientes primero; opcional ventana de 24 h. */
export function filterRecentQuotes(quotes, { last24Hours = true } = {}) {
  const pool = last24Hours ? quotes.filter((quote) => isQuoteInLast24Hours(quote.creadoAt)) : quotes;

  return [...pool].sort((a, b) => {
    const timeA = new Date(a.creadoAt || 0).getTime();
    const timeB = new Date(b.creadoAt || 0).getTime();
    return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
  });
}

export function filterQuotesByEmpresa(quotes, plantaFilter) {
  if (plantaFilter === "general") {
    return quotes;
  }

  return quotes.filter((quote) => quote.empresaId === plantaFilter);
}

export function summarizeDashboardMetrics(quotes, { weekOnly = false } = {}) {
  const pool = weekOnly
    ? quotes.filter((quote) => isQuoteInCurrentWeek(quote.creadoAt))
    : quotes;

  const totalVolume = pool.reduce((sum, quote) => sum + (Number(quote.volumen) || 0), 0);
  const totalAmount = pool.reduce((sum, quote) => sum + (Number(quote.total) || 0), 0);

  let pendientes = 0;
  let cerradas = 0;

  for (const quote of pool) {
    const status = normalizeCotizacionEstatus(quote.status);
    if (status === ESTATUS.CERRADA) cerradas += 1;
    else if (status === ESTATUS.PENDIENTE) pendientes += 1;
  }

  return {
    totalVolume,
    totalAmount,
    pendingCount: pendientes,
    closedCount: cerradas,
    totalQuotes: pool.length,
  };
}

export function isQuoteInCurrentWeek(creadoAt) {
  if (!creadoAt) return false;

  const quoteDay = new Date(creadoAt);
  quoteDay.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  return quoteDay >= weekStart && quoteDay <= today;
}

export function buildLeaderboardRows(quotes) {
  const byVendor = new Map();

  for (const quote of quotes) {
    const vendorKey = `${quote.vendedorNombre ?? "—"}|${quote.empresaId ?? ""}`;
    const row =
      byVendor.get(vendorKey) ??
      {
        vendorKey,
        vendedorNombre: quote.vendedorNombre || "Sin vendedor",
        empresaId: quote.empresaId,
        planta: getPlantaLabel(quote.empresaId),
        totalCotizaciones: 0,
        pendientes: 0,
        cerradas: 0,
        montoTotal: 0,
        montoCerradas: 0,
      };

    const status = normalizeCotizacionEstatus(quote.status);
    const quoteTotal = Number(quote.total) || 0;
    row.totalCotizaciones += 1;
    row.montoTotal += quoteTotal;

    if (status === ESTATUS.CERRADA) {
      row.cerradas += 1;
      row.montoCerradas += quoteTotal;
    } else if (status === ESTATUS.PENDIENTE) {
      row.pendientes += 1;
    }

    byVendor.set(vendorKey, row);
  }

  return [...byVendor.values()]
    .map((row) => {
      const eficienciaPct =
        row.totalCotizaciones > 0
          ? Math.round((row.cerradas / row.totalCotizaciones) * 1000) / 10
          : 0;

      return {
        ...row,
        eficienciaPct,
      };
    })
    .sort((a, b) => b.montoTotal - a.montoTotal);
}

export function paginateRows(rows, page, pageSize = LEADERBOARD_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    totalRows: rows.length,
    items: rows.slice(start, start + pageSize),
  };
}
