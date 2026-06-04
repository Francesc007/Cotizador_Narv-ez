"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Banknote,
  DollarSign,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  Gauge,
  HardHat,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  PenLine,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import {
  formatMexicoDateLong,
  getMexicoDayKey,
  mexicoDayKeyDaysAgo,
  MEXICO_TZ,
  parseMexicoDisplayDateToDayKey,
  todayMexicoDayKey,
} from "@/lib/dates/mexico";
import { isGlobalAdmin, isPlantAdmin } from "@/lib/auth/admin-scope";
import { getTenant, NEUTRAL_TENANT, TENANTS } from "@/lib/tenants/themes";
import {
  DASHBOARD_RECENT_QUOTES_PAGE_SIZE,
  LEADERBOARD_PAGE_SIZE,
  VENDOR_CHART_TOP_LIMIT,
  buildLeaderboardRows,
  filterQuotesByEmpresa,
  filterRecentQuotes,
  getPlantaBadgeClass,
  getPlantaEficienciaClass,
  getPlantaLabel,
  paginateRows,
  summarizeDashboardMetrics,
} from "@/lib/dashboard/utils";
import { EMPRESA_IDS, ESTATUS, normalizeCotizacionEstatus } from "@/lib/supabase/schema";

const IVA = 0.16;

const ADMIN_QUOTE_PLANTA_OPTIONS = [
  { value: EMPRESA_IDS.NARVAEZ, label: `${TENANTS.narvaez.name} (folio N)` },
  { value: EMPRESA_IDS.TEPEXI, label: `${TENANTS.tepexi.name} (folio T)` },
];

const VENDOR_CHART_HEIGHTS = ["h-16", "h-20", "h-24", "h-28", "h-32", "h-36", "h-40"];

const VENDOR_CHART_PALETTES = {
  [EMPRESA_IDS.NARVAEZ]: {
    front: "linear-gradient(180deg, #fb923c 0%, #ea580c 52%, #c2410c 100%)",
    side: "#9a3412",
    top: "#fdba74",
  },
  [EMPRESA_IDS.TEPEXI]: {
    front: "linear-gradient(180deg, #60a5fa 0%, #103a6b 52%, #0a2d57 100%)",
    side: "#0a2d57",
    top: "#93c5fd",
  },
  neutral: {
    front: "linear-gradient(180deg, #64748b 0%, #475569 52%, #334155 100%)",
    side: "#1e293b",
    top: "#94a3b8",
  },
};

const cardClass =
  "app-card group rounded-2xl bg-white p-3 shadow ring-1 ring-slate-200 border-l-4 border-[var(--brand)] sm:p-4";

const sectionIconClass = "h-5 w-5 shrink-0 text-[var(--brand)]";

const vendorPanelNameClass =
  "vendor-panel-name text-base font-semibold leading-snug lg:text-[20px]";
const vendorPanelTitleClass =
  "vendor-panel-title mt-1 text-sm font-bold uppercase tracking-wide text-slate-900";

const seguimientoAccentBadgeClass =
  "rounded-full border border-red-300 bg-red-100 text-xs font-semibold text-red-700";

const statusBadgeBaseClass =
  "status-select-accent rounded-full border px-2 py-1 text-xs font-semibold outline-none transition focus:ring-2 disabled:opacity-60";

const cerradaStatusBadgeClass =
  "status-select-cerrada border-emerald-600 bg-emerald-600 text-white focus:ring-emerald-300/60";

function getCerradaStatusBadgeClass() {
  return `${statusBadgeBaseClass} ${cerradaStatusBadgeClass}`;
}

const dashboardPlantaFilterButtonClass =
  "rounded-full border-2 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-150 active:translate-y-0.5 active:scale-[0.97]";

const logoutButtonClass =
  "page-header-btn inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all duration-150 hover:bg-red-100 active:translate-y-0.5 active:scale-[0.98] active:border-red-400 active:bg-red-200 active:shadow-inner lg:w-auto lg:px-4 lg:py-2.5";

const newQuoteButtonClass =
  "page-header-btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:bg-[var(--brand-strong)] active:translate-y-0.5 active:scale-[0.98] active:bg-[var(--brand-strong)] active:shadow-md lg:w-auto lg:px-4 lg:py-2.5";

const navDockButtonClass =
  "rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5 active:scale-[0.94] active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35";

function navDockButtonVariantClass(isActive) {
  return isActive
    ? "bg-[var(--brand)] text-white shadow-inner translate-y-0.5 scale-[0.96] ring-1 ring-black/10"
    : "bg-slate-100 text-slate-600 shadow-sm hover:bg-slate-200 active:bg-slate-300";
}

const inputCotizadorClass =
  "input-cotizador w-full rounded-xl border border-slate-200 bg-slate-50 outline-none transition focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70";

const FC_RESISTANCE_VALUES = [100, 150, 200, 250, 300, 350];
const MR_RESISTANCE_VALUES = [35, 36, 38, 40, 42, 45, 48, 50];
const RF_RESISTANCE_VALUES = [25, 50, 75, 100];

const resistanceOptions = [
  ...FC_RESISTANCE_VALUES.map((value) => `f'c ${value}`),
  ...MR_RESISTANCE_VALUES.map((value) => `MR ${value}`),
  ...RF_RESISTANCE_VALUES.map((value) => `RF ${value}`),
];

function getResistanceFactor(resistencia) {
  if (resistencia.startsWith("f'c ")) {
    const value = Number(resistencia.slice(4));
    if (!Number.isFinite(value)) return 1;
    return 1 + ((value - 100) / 250) * 0.25;
  }

  if (resistencia.startsWith("MR ")) {
    const value = Number(resistencia.slice(3));
    if (!Number.isFinite(value)) return 1.2;
    return 1.2 + ((value - 35) / 15) * 0.1;
  }

  if (resistencia.startsWith("RF ")) {
    const value = Number(resistencia.slice(3));
    if (!Number.isFinite(value)) return 1.1;
    return 1.1 + ((value - 25) / 75) * 0.15;
  }

  return 1;
}

const ageOptions = ["1 día", "3 días", "7 días", "14 días", "Normal 28 días"];
const slumpOptions = ["14 cm", "18 cm"];

const AGE_COST_PER_M3 = {
  "1 día": 700,
  "3 días": 500,
  "7 días": 300,
  "14 días": 100,
};

const additiveCost = {
  "Fibra de polipropileno": 150,
  Impermeabilizante: 100,
};

const ADDITIVE_SELECT_OPTIONS = Object.keys(additiveCost);

function getAdditiveRatePerM3(selectedAditivos) {
  return selectedAditivos.reduce((sum, name) => sum + (additiveCost[name] ?? 0), 0);
}

function serializeAditivos(selectedAditivos) {
  return selectedAditivos.length > 0 ? selectedAditivos.join(", ") : "Ninguno";
}

function getAgeCostPerM3(edad) {
  return AGE_COST_PER_M3[edad] ?? 0;
}

const extraServiceCost = {
  bombaEstacionaria: 1800,
  bombaPluma: 3200,
  domingo: 900,
  nocturno: 750,
};

const VACIO_COST_PER_M3 = 600;

const money = (value) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const nombreDesdeEmail = (correo) => {
  const localPart = correo.trim().split("@")[0] || "";
  if (!localPart) return "Vendedor";

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

function dashboardPlantaFilterButtonVariantClass(variant, active) {
  if (variant === "tepexi") {
    return active
      ? "border-[#103a6b] bg-[#103a6b] text-white"
      : "border-[#103a6b] bg-[#103a6b]/10 text-[#103a6b] hover:bg-[#103a6b]/15";
  }

  if (variant === "narvaez") {
    return active
      ? "border-[#ea580c] bg-[#ea580c] text-white"
      : "border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c] hover:bg-[#ea580c]/15";
  }

  return active
    ? "border-slate-800 bg-slate-800 text-white"
    : "border-slate-800 bg-slate-800/10 text-slate-800 hover:bg-slate-800/15";
}

function buildLast7DayTabs() {
  const tabs = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const key = mexicoDayKeyDaysAgo(offset);
    const [year, month, day] = key.split("-");
    const anchor = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 18, 0, 0));
    const datePart = `${Number(day)} ${anchor
      .toLocaleDateString("es-MX", { timeZone: MEXICO_TZ, month: "short" })
      .toUpperCase()}`;
    const weekday = anchor.toLocaleDateString("es-MX", { timeZone: MEXICO_TZ, weekday: "short" });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    let label;
    if (offset === 0) label = `Hoy | ${datePart}`;
    else if (offset === 1) label = `Ayer | ${datePart}`;
    else label = `${capitalizedWeekday} | ${datePart}`;

    tabs.push({ key, label });
  }

  return tabs;
}

function getQuoteDayKey(quote) {
  if (quote.creadoAt) {
    return getMexicoDayKey(quote.creadoAt);
  }

  return parseMexicoDisplayDateToDayKey(quote.fecha);
}

function formatVolume(value) {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} m3`;
}

function normalizeWhatsAppPhone(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatContactPhone(value) {
  const digits = normalizeWhatsAppPhone(String(value ?? ""));
  if (!digits) return "—";
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function summarizeCotizaciones(quotes) {
  return {
    total: quotes.length,
    cerradas: quotes.filter((quote) => normalizeCotizacionEstatus(quote.status) === ESTATUS.CERRADA).length,
    pendientes: quotes.filter((quote) => normalizeCotizacionEstatus(quote.status) === ESTATUS.PENDIENTE).length,
  };
}

function formatCompactMoney(value) {
  const amount = Number(value) || 0;

  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `$${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}k`;
  }

  return money(amount);
}

function shortenVendorLabel(name) {
  const parts = String(name || "Vendedor").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "Vendedor";
  }

  if (parts.length === 1) {
    return parts[0].length > 12 ? `${parts[0].slice(0, 11)}…` : parts[0];
  }

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function buildVendorChartBars(quotes) {
  const totalsByVendor = new Map();

  for (const quote of quotes) {
    const vendorKey = `${quote.vendedorNombre ?? "—"}|${quote.empresaId ?? "neutral"}`;
    const current = totalsByVendor.get(vendorKey) ?? {
      label: quote.vendedorNombre || "Sin vendedor",
      empresaId: quote.empresaId,
      total: 0,
      count: 0,
    };

    current.total += Number(quote.total) || 0;
    current.count += 1;
    totalsByVendor.set(vendorKey, current);
  }

  const vendors = [...totalsByVendor.values()].sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...vendors.map((vendor) => vendor.total), 1);
  const maxHeightIndex = VENDOR_CHART_HEIGHTS.length - 1;

  return vendors.map((vendor) => {
    const ratio = vendor.total / maxTotal;
    const heightIndex =
      vendor.total <= 0 ? 0 : Math.max(1, Math.round(ratio * maxHeightIndex));
    const palette =
      VENDOR_CHART_PALETTES[vendor.empresaId] ?? VENDOR_CHART_PALETTES.neutral;

    return {
      barId: `${vendor.label}-${vendor.empresaId}`,
      label: shortenVendorLabel(vendor.label),
      fullLabel: `${vendor.label} · ${vendor.count} cotizacion${vendor.count === 1 ? "" : "es"}`,
      height: VENDOR_CHART_HEIGHTS[heightIndex],
      value: formatCompactMoney(vendor.total),
      ...palette,
    };
  });
}

function getQuotePdfUrl(folio) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pdf/${encodeURIComponent(folio)}`;
  }
  return `/pdf/${encodeURIComponent(folio)}`;
}

function buildWhatsAppUrl(phone, { solicitante, cliente, folio, total }) {
  const nombre = (solicitante || cliente).trim();
  const pdfUrl = getQuotePdfUrl(folio);
  const text = `Hola ${nombre}, le anexo su cotizacion con Folio ${folio} por un total de ${money(total)}. Puede descargar su comprobante aqui: ${pdfUrl}`;
  return `https://wa.me/52${phone}?text=${encodeURIComponent(text)}`;
}

export default function Page() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cliente, setCliente] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [whatsappCliente, setWhatsappCliente] = useState("");
  const [cp, setCp] = useState("");

  const [volumen, setVolumen] = useState("");
  const [resistencia, setResistencia] = useState("f'c 200");
  const [edad, setEdad] = useState("Normal 28 días");
  const [revenimiento, setRevenimiento] = useState("14 cm");
  const [aditivos, setAditivos] = useState([]);

  const [bombaEstacionaria, setBombaEstacionaria] = useState(false);
  const [bombaPluma, setBombaPluma] = useState(false);
  const [domingo, setDomingo] = useState(false);
  const [nocturno, setNocturno] = useState(false);
  const [cargoVacio, setCargoVacio] = useState(false);
  const [cargoVacioM3, setCargoVacioM3] = useState("");
  const [cargoDistancia, setCargoDistancia] = useState(false);
  const [cargoDistanciaMonto, setCargoDistanciaMonto] = useState("");

  const [discountPercent, setDiscountPercent] = useState("");
  const [documentActionsOpen, setDocumentActionsOpen] = useState(false);
  const [emittedQuote, setEmittedQuote] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [displayFolio, setDisplayFolio] = useState("—");
  const [adminPlantaEmision, setAdminPlantaEmision] = useState(EMPRESA_IDS.NARVAEZ);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [dashboardQuotes, setDashboardQuotes] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardPlantaFilter, setDashboardPlantaFilter] = useState("general");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [dashboardRecentQuotesPage, setDashboardRecentQuotesPage] = useState(1);
  const [seguimientoQuotes, setSeguimientoQuotes] = useState([]);
  const [seguimientoLoading, setSeguimientoLoading] = useState(false);
  const [seguimientoDayKey, setSeguimientoDayKey] = useState(todayMexicoDayKey);

  const fechaActual = useMemo(() => formatMexicoDateLong(), []);

  const vendedorNombre = useMemo(
    () => sessionUser?.name || nombreDesdeEmail(email),
    [sessionUser, email]
  );

  // Tema activo segun la empresa del perfil autenticado.
  // Antes de iniciar sesion (o para la dirección) el tema es neutral.
  const tenant = useMemo(() => getTenant(sessionUser?.empresa), [sessionUser]);
  const themeClass = sessionUser ? tenant.themeClass : NEUTRAL_TENANT.themeClass;
  const globalAdmin = isGlobalAdmin(sessionUser);
  const plantAdmin = isPlantAdmin(sessionUser);

  useEffect(() => {
    if (!plantAdmin || !sessionUser?.empresa) {
      return;
    }

    if (sessionUser.empresa === EMPRESA_IDS.NARVAEZ || sessionUser.empresa === EMPRESA_IDS.TEPEXI) {
      setAdminPlantaEmision(sessionUser.empresa);
      setDashboardPlantaFilter(sessionUser.empresa);
    }
  }, [plantAdmin, sessionUser?.empresa]);

  const loadSeguimientoQuotes = async () => {
    setSeguimientoLoading(true);
    try {
      const response = await fetch("/api/quotes", { credentials: "include" });
      if (!response.ok) {
        setSeguimientoQuotes([]);
        return;
      }

      const data = await response.json();
      setSeguimientoQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch {
      setSeguimientoQuotes([]);
    } finally {
      setSeguimientoLoading(false);
    }
  };

  const loadDashboardQuotes = async () => {
    setDashboardLoading(true);
    try {
      const response = await fetch("/api/quotes", { credentials: "include" });
      if (!response.ok) {
        setDashboardQuotes([]);
        return;
      }

      const data = await response.json();
      setDashboardQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch {
      setDashboardQuotes([]);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDashboardPlantaFilter = (filter) => {
    setDashboardPlantaFilter(filter);
    setLeaderboardPage(1);
    setDashboardRecentQuotesPage(1);
  };

  const dashboardFilteredQuotes = useMemo(
    () => filterQuotesByEmpresa(dashboardQuotes, dashboardPlantaFilter),
    [dashboardQuotes, dashboardPlantaFilter]
  );

  const vendorChartBars = useMemo(
    () => buildVendorChartBars(dashboardFilteredQuotes).slice(0, VENDOR_CHART_TOP_LIMIT),
    [dashboardFilteredQuotes]
  );

  const dashboardMetrics = useMemo(
    () => summarizeDashboardMetrics(dashboardFilteredQuotes, { weekOnly: true }),
    [dashboardFilteredQuotes]
  );

  const dashboardTotals = useMemo(
    () => summarizeDashboardMetrics(dashboardFilteredQuotes),
    [dashboardFilteredQuotes]
  );

  const leaderboardRows = useMemo(
    () => buildLeaderboardRows(dashboardFilteredQuotes),
    [dashboardFilteredQuotes]
  );

  const leaderboardPagination = useMemo(
    () => paginateRows(leaderboardRows, leaderboardPage, LEADERBOARD_PAGE_SIZE),
    [leaderboardRows, leaderboardPage]
  );

  const dashboardRecentQuotes = useMemo(
    () => filterRecentQuotes(dashboardFilteredQuotes, { last24Hours: true }),
    [dashboardFilteredQuotes]
  );

  const dashboardRecentQuotesPagination = useMemo(
    () =>
      paginateRows(
        dashboardRecentQuotes,
        dashboardRecentQuotesPage,
        DASHBOARD_RECENT_QUOTES_PAGE_SIZE
      ),
    [dashboardRecentQuotes, dashboardRecentQuotesPage]
  );

  const seguimientoSummary = useMemo(
    () => summarizeCotizaciones(seguimientoQuotes),
    [seguimientoQuotes]
  );

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (!response.ok) {
          setView("login");
          return;
        }

        const data = await response.json();
        clearWorkspaceForSession(data.user);
        setSessionUser(data.user);
        setEmail(data.user.email);
        setView(data.user.role === "admin" ? "dashboard" : "cotizador");
      } catch {
        setView("login");
      } finally {
        setAuthLoading(false);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    if (view === "dashboard" && sessionUser?.role === "admin") {
      loadDashboardQuotes();
    }
  }, [view, sessionUser?.role]);

  const priceModel = useMemo(() => {
    const parsedVolume = Number(volumen);
    const baseM3 = volumen === "" || !Number.isFinite(parsedVolume) ? 0 : Math.max(0.5, parsedVolume);
    const baseUnit = 1750;
    const resistanceBoost = getResistanceFactor(resistencia);
    const slumpBoost = revenimiento === "18 cm" ? 1.04 : 1;
    const unitPrice = baseUnit * resistanceBoost * slumpBoost;
    const concreteSubtotal = baseM3 > 0 ? unitPrice * baseM3 : 0;
    const ageRate = getAgeCostPerM3(edad);
    const ageSubtotal = baseM3 > 0 ? ageRate * baseM3 : 0;
    const additiveRate = getAdditiveRatePerM3(aditivos);
    const additiveSubtotal = baseM3 > 0 && aditivos.length > 0 ? additiveRate * baseM3 : 0;
    const extrasSubtotal =
      (bombaEstacionaria ? extraServiceCost.bombaEstacionaria : 0) +
      (bombaPluma ? extraServiceCost.bombaPluma : 0) +
      (domingo ? extraServiceCost.domingo : 0) +
      (nocturno ? extraServiceCost.nocturno : 0);
    const parsedVacioM3 = Number(cargoVacioM3);
    const vacioM3 =
      cargoVacio && cargoVacioM3 !== "" && Number.isFinite(parsedVacioM3) && parsedVacioM3 > 0
        ? parsedVacioM3
        : 0;
    const vacioSubtotal = vacioM3 * VACIO_COST_PER_M3;
    const parsedDistanciaMonto = Number(cargoDistanciaMonto);
    const distanciaSubtotal =
      cargoDistancia &&
      cargoDistanciaMonto !== "" &&
      Number.isFinite(parsedDistanciaMonto) &&
      parsedDistanciaMonto > 0
        ? parsedDistanciaMonto
        : 0;
    const subtotal =
      concreteSubtotal + ageSubtotal + additiveSubtotal + extrasSubtotal + vacioSubtotal + distanciaSubtotal;
    const parsedDiscountPercent = discountPercent === "" ? 0 : Number(discountPercent);
    const safeDiscountPercent = Number.isFinite(parsedDiscountPercent)
      ? Math.max(0, Math.min(parsedDiscountPercent, 30))
      : 0;
    const discount = subtotal * safeDiscountPercent / 100;
    const taxable = subtotal - discount;
    const iva = taxable * IVA;
    const total = taxable + iva;

    return {
      baseM3,
      unitPrice,
      concreteSubtotal,
      ageRate,
      ageSubtotal,
      additiveRate,
      additiveSubtotal,
      extrasSubtotal,
      vacioM3,
      vacioSubtotal,
      distanciaSubtotal,
      subtotal,
      discount,
      iva,
      total,
    };
  }, [
    volumen,
    resistencia,
    edad,
    revenimiento,
    aditivos,
    bombaEstacionaria,
    bombaPluma,
    domingo,
    nocturno,
    cargoVacio,
    cargoVacioM3,
    cargoDistancia,
    cargoDistanciaMonto,
    discountPercent,
  ]);

  const cpDetected = cp.trim() === "72000";
  const formLocked = Boolean(emittedQuote);

  const toggleAditivo = (name, checked) => {
    setAditivos((current) =>
      checked ? [...current, name] : current.filter((item) => item !== name)
    );
  };

  const seguimientoDayTabs = useMemo(
    () => (view === "seguimiento" ? buildLast7DayTabs() : []),
    [view]
  );

  const seguimientoDayCounts = useMemo(() => {
    const counts = Object.fromEntries(seguimientoDayTabs.map((tab) => [tab.key, 0]));

    for (const quote of seguimientoQuotes) {
      const dayKey = getQuoteDayKey(quote);
      if (dayKey && dayKey in counts) {
        counts[dayKey] += 1;
      }
    }

    return counts;
  }, [seguimientoQuotes, seguimientoDayTabs]);

  const seguimientoQuotesByDay = useMemo(
    () => seguimientoQuotes.filter((quote) => getQuoteDayKey(quote) === seguimientoDayKey),
    [seguimientoQuotes, seguimientoDayKey]
  );

  const activeSeguimientoTab =
    seguimientoDayTabs.find((tab) => tab.key === seguimientoDayKey) ?? seguimientoDayTabs[0];

  const statusBadge = (status) => {
    const normalized = normalizeCotizacionEstatus(status);

    if (normalized === ESTATUS.CERRADA) {
      return getCerradaStatusBadgeClass();
    }

    return `${statusBadgeBaseClass} ring-[var(--brand)] ${seguimientoAccentBadgeClass} focus:ring-[var(--brand)]/35`;
  };

  const dashboardStatusBadge = useCallback((status) => getDashboardPastelStatusBadgeClass(status), []);

  const handleLogin = async (event) => {
    event?.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Credenciales invalidas.");
        return;
      }

      clearWorkspaceForSession(data.user);
      setSessionUser(data.user);
      setEmail(data.user.email);
      setPassword("");
      setShowPassword(false);
      setView(data.user.role === "admin" ? "dashboard" : "cotizador");
    } catch {
      setLoginError("No fue posible conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    clearWorkspaceForSession(null);
    setSessionUser(null);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setView("login");
  };

  const emitQuote = async () => {
    setSaveError("");

    if (emittedQuote) {
      return emittedQuote;
    }

    if (!cliente.trim()) {
      setSaveError("El nombre del cliente es obligatorio.");
      return null;
    }

    const phone = normalizeWhatsAppPhone(whatsappCliente);
    if (phone.length !== 10) {
      setSaveError("El WhatsApp del cliente debe tener 10 digitos.");
      return null;
    }

    if (!cp.trim()) {
      setSaveError("El codigo postal es obligatorio.");
      return null;
    }

    if (priceModel.baseM3 <= 0) {
      setSaveError("Ingresa el volumen en m3 para emitir la cotizacion.");
      return null;
    }

    if (globalAdmin) {
      const plantaValida = ADMIN_QUOTE_PLANTA_OPTIONS.some(
        (option) => option.value === adminPlantaEmision
      );
      if (!plantaValida) {
        setSaveError("Selecciona la planta de destino de la cotizacion.");
        return null;
      }
    }

    setIsSavingQuote(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(globalAdmin ? { empresaId: adminPlantaEmision } : {}),
          cliente,
          solicitante,
          whatsappCliente: phone,
          cp,
          volumen: priceModel.baseM3,
          resistencia,
          edad,
          revenimiento,
          aditivo: serializeAditivos(aditivos),
          bombaEstacionaria,
          bombaPluma,
          domingo,
          nocturno,
          discountPercent:
            discountPercent === ""
              ? 0
              : Math.max(0, Math.min(Number(discountPercent) || 0, 30)),
          priceModel: {
            subtotal: priceModel.subtotal,
            iva: priceModel.iva,
            total: priceModel.total,
          },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error || "No fue posible emitir la cotizacion.");
        return null;
      }

      const quote = {
        id: data.quote.id,
        folio_institucional: data.quote.folio_institucional,
        total: data.quote.total,
      };

      setDisplayFolio(data.quote.folio_institucional);
      setEmittedQuote(quote);
      loadSeguimientoQuotes();
      loadDashboardQuotes();
      return quote;
    } catch {
      setSaveError("No fue posible conectar con el servidor.");
      return null;
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleEmitQuote = async () => {
    const quote = await emitQuote();
    if (quote) {
      setDocumentActionsOpen(true);
    }
  };

  const handleWhatsApp = async () => {
    setSaveError("");

    const phone = normalizeWhatsAppPhone(whatsappCliente);
    if (phone.length !== 10) {
      setSaveError("El WhatsApp del cliente debe tener 10 digitos.");
      return;
    }

    const quote = await emitQuote();
    if (!quote) {
      return;
    }

    const url = buildWhatsAppUrl(phone, {
      solicitante,
      cliente,
      folio: quote.folio_institucional,
      total: quote.total,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = () => {
    if (!emittedQuote) {
      return;
    }

    window.open(getQuotePdfUrl(emittedQuote.folio_institucional), "_blank", "noopener,noreferrer");
  };

  const handlePrintEmitted = () => {
    if (!emittedQuote) {
      return;
    }

    window.open(
      `${getQuotePdfUrl(emittedQuote.folio_institucional)}?print=1`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const unlockQuoteForm = () => {
    setDocumentActionsOpen(false);
    setEmittedQuote(null);
    setDisplayFolio("—");
    setSaveError("");
  };

  const handleCancelEmission = async () => {
    if (!emittedQuote) {
      unlockQuoteForm();
      return;
    }

    if (emittedQuote.id) {
      try {
        const response = await fetch(`/api/quotes/${emittedQuote.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setSaveError(data.error || "No fue posible cancelar la cotizacion emitida.");
          return;
        }

        loadSeguimientoQuotes();
        if (sessionUser?.role === "admin") {
          loadDashboardQuotes();
        }
      } catch {
        setSaveError("No fue posible conectar con el servidor.");
        return;
      }
    }

    unlockQuoteForm();
  };

  const canEditSeguimientoStatus = useCallback(
    (quote) =>
      sessionUser?.role !== "admin" ||
      Boolean(sessionUser?.perfilId && quote.vendedorId === sessionUser.perfilId),
    [sessionUser]
  );

  const handleUpdateSeguimientoQuoteStatus = async (quoteId, status) => {
    setStatusUpdatingId(quoteId);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setSeguimientoQuotes((current) =>
        current.map((quote) => (quote.id === quoteId ? data.quote : quote))
      );
      if (sessionUser?.role === "admin") {
        loadDashboardQuotes();
      }
    } catch {
      // Sin cambios locales si falla la actualizacion remota.
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const resetQuoteForm = () => {
    setCliente("");
    setSolicitante("");
    setWhatsappCliente("");
    setCp("");
    setVolumen("");
    setResistencia("f'c 200");
    setEdad("Normal 28 días");
    setRevenimiento("14 cm");
    setAditivos([]);
    setBombaEstacionaria(false);
    setBombaPluma(false);
    setDomingo(false);
    setNocturno(false);
    setCargoVacio(false);
    setCargoVacioM3("");
    setCargoDistancia(false);
    setCargoDistanciaMonto("");
    setDiscountPercent("");
    setSaveError("");
    setDisplayFolio("—");
    setEmittedQuote(null);
    setDocumentActionsOpen(false);
    setIsSavingQuote(false);
  };

  function clearWorkspaceForSession(nextUser) {
    resetQuoteForm();
    setSeguimientoQuotes([]);
    setDashboardQuotes([]);
    setSeguimientoLoading(false);
    setDashboardLoading(false);
    setStatusUpdatingId(null);
    setLeaderboardPage(1);
    setDashboardRecentQuotesPage(1);
    setSeguimientoDayKey(todayMexicoDayKey());

    if (nextUser && isPlantAdmin(nextUser)) {
      setDashboardPlantaFilter(nextUser.empresa);
      setAdminPlantaEmision(nextUser.empresa);
      return;
    }

    setDashboardPlantaFilter("general");
    setAdminPlantaEmision(EMPRESA_IDS.NARVAEZ);
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-sm font-medium text-slate-600">Cargando plataforma...</p>
      </main>
    );
  }

  return (
    <main
      className={`app-view-main min-h-screen bg-slate-100 text-slate-900 ${themeClass} ${
        sessionUser
          ? "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-28"
          : ""
      }`}
    >
      {sessionUser && (
        <div className="nav-view-dock fixed bottom-0 left-0 right-0 z-50 flex max-w-full gap-1.5 rounded-t-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:bottom-3 sm:left-auto sm:right-3 sm:w-auto sm:rounded-full">
          <button
            type="button"
            onClick={() => setView("cotizador")}
            className={`${navDockButtonClass} ${navDockButtonVariantClass(view === "cotizador")}`}
          >
            Cotizador
          </button>
          <button
            type="button"
            onClick={() => {
              setSeguimientoDayKey(todayMexicoDayKey());
              setView("seguimiento");
              loadSeguimientoQuotes();
            }}
            className={`${navDockButtonClass} ${navDockButtonVariantClass(view === "seguimiento")}`}
          >
            Seguimiento
          </button>
          {sessionUser.role === "admin" && (
            <button
              type="button"
              onClick={() => {
                setView("dashboard");
                loadDashboardQuotes();
              }}
              className={`${navDockButtonClass} ${navDockButtonVariantClass(view === "dashboard")}`}
            >
              Panel
            </button>
          )}
        </div>
      )}

      {view === "login" && (
        <section className="login-screen-section mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6 lg:px-5 lg:py-8">
          <div className="login-screen-card rounded-2xl border-l-4 border-slate-800 bg-white p-5 shadow-xl ring-1 ring-slate-200 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl lg:p-6">
            <div className="login-screen-head mb-7 text-center">
              <DualBrandLogos size="login" className="mx-auto mb-8" priority />
              <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 sm:text-lg">
                Ecosistema de Cotización Corporativo
              </h1>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendedor@concretos.com"
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Contrasena</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {loginError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="shine-sweep relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> {isSubmitting ? "Validando..." : "Ingresar"}
                </span>
              </button>
            </form>
          </div>
        </section>
      )}

      {view === "cotizador" && sessionUser && (
        <section className="app-view-section mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <header className={`page-header-card mb-4 ${cardClass}`}>
            <div className="page-header-layout">
              <div className="page-header-main min-w-0 flex-1">
                <div className="page-header-brand">
                  <HeaderLogo tenant={tenant} large className="header-logo-img mt-0 shrink-0" />
                  <div className="page-header-text min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className={`${vendorPanelNameClass} break-words lg:truncate`}>{vendedorNombre}</p>
                    <h2 className={`${vendorPanelTitleClass} text-balance`}>Cotizador de Concreto Premezclado</h2>
                  </div>
                </div>
              </div>
              <div className="page-header-actions">
                <div className="page-header-actions-toolbar">
                  <button type="button" onClick={handleLogout} className={logoutButtonClass}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar sesion
                  </button>
                  <button type="button" onClick={resetQuoteForm} className={newQuoteButtonClass}>
                    <FilePlus className="h-4 w-4 shrink-0" />
                    + Nueva Cotizacion
                  </button>
                </div>
                <div className="page-header-meta">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Fecha</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-slate-800 sm:text-sm">
                      <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{fechaActual}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Folio</p>
                    <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">{displayFolio}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {globalAdmin && (
            <article className={`mb-4 ${cardClass}`}>
              <label className="block">
                <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-slate-700">
                  Planta de destino
                </span>
                <select
                  value={adminPlantaEmision}
                  onChange={(e) => setAdminPlantaEmision(e.target.value)}
                  disabled={formLocked}
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {ADMIN_QUOTE_PLANTA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          )}

          <div className="grid min-w-0 gap-4 lg:grid-cols-5">
            <div className="min-w-0 space-y-4 lg:col-span-3">
              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Users className={sectionIconClass} />
                  Paso 1 - Datos
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Nombre del Cliente</span>
                    <input
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Constructora Atlas"
                      disabled={formLocked}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      WhatsApp del Cliente (10 digitos)
                    </span>
                    <input
                      value={whatsappCliente}
                      onChange={(e) => setWhatsappCliente(normalizeWhatsAppPhone(e.target.value))}
                      placeholder="2221234567"
                      inputMode="numeric"
                      maxLength={10}
                      disabled={formLocked}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Solicitante</span>
                    <input
                      value={solicitante}
                      onChange={(e) => setSolicitante(e.target.value)}
                      placeholder="Ing. Perez"
                      disabled={formLocked}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </label>
                </div>
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <MapPin className={sectionIconClass} />
                  Paso 2 - Ubicacion
                </h3>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Codigo Postal</span>
                  <input
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    placeholder="Escribe 72000 para demo"
                    disabled={formLocked}
                    className={`${inputCotizadorClass} px-3 py-2.5 text-sm`}
                  />
                </label>
                {cpDetected && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Detectado: Puebla Centro | Zona 1 de flete
                    </span>
                  </div>
                )}
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <HardHat className={sectionIconClass} />
                  Paso 3 - Configuracion del concreto
                </h3>
                <label className="volume-field-wrap mb-4 block rounded-xl border-2 p-3">
                  <span className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <Truck className={sectionIconClass} />
                    Volumen (m3)
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={volumen}
                    onChange={(e) => setVolumen(e.target.value)}
                    placeholder="24"
                    disabled={formLocked}
                    className={`${inputCotizadorClass} bg-white px-3 py-2.5 text-lg font-semibold text-slate-900`}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="Resistencia" value={resistencia} onChange={setResistencia} options={resistanceOptions} disabled={formLocked} />
                  <SelectField label="Edad" value={edad} onChange={setEdad} options={ageOptions} disabled={formLocked} />
                  <SelectField label="Revenimiento" value={revenimiento} onChange={setRevenimiento} options={slumpOptions} disabled={formLocked} />
                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Adicionante</span>
                    <p className="mb-2 text-xs text-slate-500">Puedes elegir uno, ambos o ninguno.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ADDITIVE_SELECT_OPTIONS.map((name) => (
                        <CheckOption
                          key={name}
                          label={`${name} (${money(additiveCost[name])} / m3)`}
                          checked={aditivos.includes(name)}
                          disabled={formLocked}
                          onChange={(checked) => toggleAditivo(name, checked)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <ListChecks className={sectionIconClass} />
                  Paso 4 - Servicios extra
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm min-[480px]:grid-cols-2">
                  <CheckOption label="Bomba Estacionaria" checked={bombaEstacionaria} onChange={setBombaEstacionaria} disabled={formLocked} />
                  <CheckOption label="Bomba Pluma" checked={bombaPluma} onChange={setBombaPluma} disabled={formLocked} />
                  <CheckOption label="Servicio en Domingo" checked={domingo} onChange={setDomingo} disabled={formLocked} />
                  <CheckOption label="Horario Nocturno" checked={nocturno} onChange={setNocturno} disabled={formLocked} />
                  <div className="space-y-2">
                    <CheckOption
                      label="Cargo por distancia"
                      checked={cargoDistancia}
                      disabled={formLocked}
                      onChange={(checked) => {
                        setCargoDistancia(checked);
                        if (!checked) setCargoDistanciaMonto("");
                      }}
                    />
                    {cargoDistancia && (
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          Monto a sumar al desglose (MXN)
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={cargoDistanciaMonto}
                          onChange={(e) => setCargoDistanciaMonto(e.target.value)}
                          placeholder="1500"
                          disabled={formLocked}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>
                    )}
                  </div>
                  <div className="space-y-2">
                    <CheckOption
                      label="Cargo por vacio por m3"
                      checked={cargoVacio}
                      disabled={formLocked}
                      onChange={(checked) => {
                        setCargoVacio(checked);
                        if (!checked) setCargoVacioM3("");
                      }}
                    />
                    {cargoVacio && (
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          Metros cubicos en vacio ($600 / m3)
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={cargoVacioM3}
                          onChange={(e) => setCargoVacioM3(e.target.value)}
                          placeholder="1"
                          disabled={formLocked}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </article>
            </div>

            <aside className="quote-print-area min-w-0 space-y-4 lg:col-span-2">
              <article className={`quote-summary-sticky sticky top-4 ${cardClass}`}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Banknote className={sectionIconClass} />
                  Paso 5 - Cierre y desglose
                </h3>
                <div className="mb-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Resumen de ticket</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {priceModel.baseM3 > 0
                      ? `${priceModel.baseM3} m3 x ${money(priceModel.unitPrice)} / m3`
                      : "Ej. 24 m3 x precio / m3"}
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="quote-breakdown-row flex justify-between gap-2">
                    <span>Concreto base</span>
                    <span className="shrink-0 font-semibold">{money(priceModel.concreteSubtotal)}</span>
                  </li>
                  {priceModel.ageSubtotal > 0 && (
                    <li className="quote-breakdown-row flex justify-between gap-2">
                      <span>
                        {edad} ({money(priceModel.ageRate)} / m3)
                      </span>
                      <span className="font-semibold">{money(priceModel.ageSubtotal)}</span>
                    </li>
                  )}
                  {aditivos.map((name) => (
                    <li key={name} className="quote-breakdown-row flex justify-between gap-2">
                      <span>
                        {name} ({money(additiveCost[name])} / m3)
                      </span>
                      <span className="shrink-0 font-semibold">
                        {money(priceModel.baseM3 > 0 ? additiveCost[name] * priceModel.baseM3 : 0)}
                      </span>
                    </li>
                  ))}
                  <li className="quote-breakdown-row flex justify-between gap-2">
                    <span>Servicios extra</span>
                    <span className="shrink-0 font-semibold">{money(priceModel.extrasSubtotal)}</span>
                  </li>
                  {priceModel.vacioSubtotal > 0 && (
                    <li className="quote-breakdown-row flex justify-between gap-2">
                      <span>Cargo por vacio ({priceModel.vacioM3} m3)</span>
                      <span className="shrink-0 font-semibold">{money(priceModel.vacioSubtotal)}</span>
                    </li>
                  )}
                  {priceModel.distanciaSubtotal > 0 && (
                    <li className="quote-breakdown-row flex justify-between gap-2">
                      <span>Cargo por distancia</span>
                      <span className="shrink-0 font-semibold">{money(priceModel.distanciaSubtotal)}</span>
                    </li>
                  )}
                  <li className="quote-breakdown-row flex justify-between gap-2 border-t border-slate-200 pt-2">
                    <span>Subtotal</span>
                    <span className="shrink-0 font-semibold">{money(priceModel.subtotal)}</span>
                  </li>
                </ul>

                <label className="no-print mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Descuento Manual (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                    disabled={formLocked}
                    className={`${inputCotizadorClass} px-3 py-2.5 text-sm`}
                  />
                </label>

                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex justify-between">
                    <span>Descuento</span>
                    <span className="font-semibold text-red-500">- {money(priceModel.discount)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>IVA (16%)</span>
                    <span className="font-semibold">{money(priceModel.iva)}</span>
                  </li>
                  <li className="flex justify-between rounded-lg bg-slate-900 px-3 py-2 text-base font-bold text-white">
                    <span>Total</span>
                    <span>{money(priceModel.total)}</span>
                  </li>
                </ul>

                <div className="no-print mt-4 space-y-2">
                  <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                    {!emittedQuote && (
                      <button
                        type="button"
                        onClick={handleEmitQuote}
                        disabled={isSavingQuote}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <FilePlus className="h-4 w-4" />
                        {isSavingQuote ? "Emitiendo..." : "Emitir Cotizacion"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      disabled={isSavingQuote}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 ${emittedQuote ? "min-[400px]:col-span-2" : ""}`}
                    >
                      <Send className="h-4 w-4" />
                      {isSavingQuote ? "Procesando..." : "Enviar por WhatsApp"}
                    </button>
                  </div>
                  {emittedQuote && !documentActionsOpen && (
                    <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FileText className="h-4 w-4" />
                        Descargar PDF
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintEmitted}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir Ahora
                      </button>
                    </div>
                  )}
                </div>
                {saveError && (
                  <p className="no-print mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
                )}
              </article>
            </aside>
          </div>
        </section>
      )}

      {view === "seguimiento" && sessionUser && (
        <section className="app-view-section mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <header className={`page-header-card mb-4 ${cardClass}`}>
            <div className="page-header-layout">
              <div className="page-header-main min-w-0 flex-1">
                <div className="page-header-brand">
                  <HeaderLogo tenant={tenant} large className="header-logo-img mt-0 shrink-0" />
                  <div className="page-header-text min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className={`${vendorPanelNameClass} break-words lg:truncate`}>{vendedorNombre}</p>
                    <h2 className={`${vendorPanelTitleClass} text-balance`}>Seguimiento de cotizaciones</h2>
                  </div>
                </div>
              </div>
              <div className="page-header-actions page-header-actions--inline">
                <div className="page-header-actions-toolbar">
                  <button type="button" onClick={handleLogout} className={logoutButtonClass}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar sesion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetQuoteForm();
                      setView("cotizador");
                    }}
                    className={newQuoteButtonClass}
                  >
                    <FilePlus className="h-4 w-4 shrink-0" />
                    + Nueva Cotizacion
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="dashboard-metrics-grid mb-4 grid gap-3 sm:grid-cols-3">
            <MetricCard
              title="Mis cotizaciones"
              value={`${seguimientoQuotes.length} registradas`}
              icon={<PenLine className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Pendientes"
              value={`${seguimientoSummary.pendientes}`}
              icon={<ClipboardList className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Cerradas"
              value={`${seguimientoSummary.cerradas}`}
              icon={<CircleDollarSign className="h-5 w-5 text-[var(--brand)]" />}
            />
          </div>

          <article className={`${cardClass} min-w-0`}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                <ListChecks className={sectionIconClass} />
                Mis cotizaciones
              </h3>
              {activeSeguimientoTab && (
                <p className="text-xs font-medium text-slate-500 sm:text-right">
                  {seguimientoQuotesByDay.length} en {activeSeguimientoTab.label.toLowerCase()}
                </p>
              )}
            </div>

            <SeguimientoFolderTabs
              tabs={seguimientoDayTabs}
              activeKey={seguimientoDayKey}
              counts={seguimientoDayCounts}
              onSelect={setSeguimientoDayKey}
            >
              <QuotesTable
                quotes={seguimientoQuotesByDay}
                loading={seguimientoLoading}
                showVendor={sessionUser.role === "admin"}
                showContact
                canEditStatus={canEditSeguimientoStatus}
                statusUpdatingId={statusUpdatingId}
                onStatusChange={handleUpdateSeguimientoQuoteStatus}
                statusBadge={statusBadge}
                money={money}
                emptyMessage={`No hay cotizaciones registradas para ${activeSeguimientoTab?.label?.toLowerCase() ?? "este dia"}.`}
              />
            </SeguimientoFolderTabs>
          </article>
        </section>
      )}

      {view === "dashboard" && sessionUser?.role === "admin" && (
        <section className="app-view-section mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <header className={`page-header-card mb-4 ${cardClass}`}>
            <div className="page-header-layout">
              <div className="page-header-main min-w-0 flex-1">
                <div className="page-header-brand">
                  <HeaderLogo tenant={tenant} large className="header-logo-img mt-0 shrink-0" />
                  <div className="page-header-text min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Panel de gerencia
                    </p>
                    <h2 className={`${vendorPanelTitleClass} text-balance`}>Administrador</h2>
                  </div>
                </div>
              </div>
              <div className="page-header-actions page-header-actions--inline">
                <div className="page-header-actions-toolbar">
                  <button type="button" onClick={handleLogout} className={logoutButtonClass}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar sesion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetQuoteForm();
                      setView("cotizador");
                    }}
                    className={newQuoteButtonClass}
                  >
                    <FilePlus className="h-4 w-4 shrink-0" />
                    + Nueva Cotizacion
                  </button>
                </div>
              </div>
            </div>
          </header>

          {globalAdmin && (
            <DashboardPlantaFilters
              value={dashboardPlantaFilter}
              onChange={handleDashboardPlantaFilter}
              className="mb-4"
            />
          )}

          <div className="dashboard-metrics-grid grid gap-3 sm:grid-cols-3">
            <MetricCard
              title="Volumen Total Cotizado"
              value={dashboardLoading ? "Cargando..." : formatVolume(dashboardTotals.totalVolume)}
              icon={<Gauge className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Monto Total Cotizado"
              value={dashboardLoading ? "Cargando..." : money(dashboardTotals.totalAmount)}
              icon={<DollarSign className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Cotizaciones de la Semana"
              value={
                dashboardLoading
                  ? "Cargando..."
                  : `${dashboardMetrics.pendingCount} pendientes / ${dashboardMetrics.closedCount} cerradas`
              }
              icon={<Phone className="h-5 w-5 text-[var(--brand)]" />}
            />
          </div>

          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3 lg:items-stretch">
            <article className={`${cardClass} flex min-w-0 flex-col lg:col-span-1 lg:min-h-[19rem]`}>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-700 text-balance">
                Top vendedores por monto
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Maximo {VENDOR_CHART_TOP_LIMIT} barras · filtro{" "}
                {dashboardPlantaFilter === "general"
                  ? "General"
                  : getPlantaLabel(dashboardPlantaFilter)}
              </p>
              {dashboardLoading ? (
                <p className="flex h-60 items-center justify-center text-sm text-slate-500">
                  Cargando grafica...
                </p>
              ) : vendorChartBars.length === 0 ? (
                <p className="flex h-60 items-center justify-center px-4 text-center text-sm text-slate-500">
                  No hay cotizaciones para mostrar con este filtro.
                </p>
              ) : (
                <div className="vendor-top-chart flex h-60 items-end justify-center gap-3 overflow-x-auto px-2 pb-3 pt-7">
                  {vendorChartBars.map(({ barId, ...bar }) => (
                    <Bar key={barId} {...bar} />
                  ))}
                </div>
              )}
            </article>

            <DashboardRecentQuotesCard
              quotes={dashboardRecentQuotesPagination.items}
              page={dashboardRecentQuotesPagination.page}
              totalPages={dashboardRecentQuotesPagination.totalPages}
              totalRows={dashboardRecentQuotesPagination.totalRows}
              onPageChange={setDashboardRecentQuotesPage}
              loading={dashboardLoading}
              statusBadge={dashboardStatusBadge}
              money={money}
              plantaFilter={dashboardPlantaFilter}
            />
          </div>

          <VendorLeaderboard
            rows={leaderboardPagination.items}
            page={leaderboardPagination.page}
            totalPages={leaderboardPagination.totalPages}
            totalRows={leaderboardPagination.totalRows}
            onPageChange={setLeaderboardPage}
            loading={dashboardLoading}
            plantaFilter={dashboardPlantaFilter}
          />
        </section>
      )}

      {documentActionsOpen && emittedQuote && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div className="max-h-[min(92dvh,100%)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:max-h-none">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Cotizacion emitida</h4>
              <p className="mt-1 text-sm text-slate-600">
                Folio {emittedQuote.folio_institucional} registrado. Total: {money(emittedQuote.total)}
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCancelEmission}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Cancelar y corregir
              </button>
              <button
                type="button"
                onClick={() => setDocumentActionsOpen(false)}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SeguimientoFolderTabs({ tabs, activeKey, counts, onSelect, children }) {
  return (
    <div className="relative">
      <div
        className="seguimiento-tablist flex gap-1.5 overflow-x-auto pb-0 sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Cotizaciones por dia"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          const count = counts[tab.key] ?? 0;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.key)}
              className={`group relative min-w-[5.25rem] shrink-0 rounded-t-xl border px-2 pb-2 pt-2 text-left transition-all duration-200 sm:min-w-[6.5rem] sm:px-3 ${
                active
                  ? "z-10 -mb-px border-[var(--brand)] border-b-white bg-white shadow-[0_-4px_18px_rgba(15,23,42,0.08)]"
                  : "border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 hover:border-slate-300 hover:from-white hover:to-slate-50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className={`text-xs font-bold leading-tight ${active ? "text-slate-900" : "text-slate-600"}`}>
                  {tab.label}
                </p>
                <span className="shrink-0 rounded-full border border-red-300 bg-red-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-700">
                  {count}
                </span>
              </div>
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--brand)]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}

function getDashboardPastelStatusBadgeClass(status) {
  const normalized = normalizeCotizacionEstatus(status);

  if (normalized === ESTATUS.CERRADA) {
    return `${statusBadgeBaseClass} border-emerald-200/90 bg-emerald-50/90 text-emerald-700/95`;
  }

  return `${statusBadgeBaseClass} border-amber-200/90 bg-amber-50/90 text-amber-800/90`;
}

function DashboardRecentQuotesCard({
  quotes,
  page,
  totalPages,
  totalRows,
  onPageChange,
  loading,
  statusBadge,
  money,
  plantaFilter,
}) {
  const filterLabel =
    plantaFilter === "general" ? "todas las plantas" : getPlantaLabel(plantaFilter);

  const emptyMessage = `No hay cotizaciones en las ultimas 24 h para ${filterLabel}.`;

  return (
    <article className={`dashboard-recent-quotes-card ${cardClass} flex min-w-0 flex-col lg:col-span-2 lg:min-h-[19rem]`}>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Cotizaciones recientes
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Ultimas 24 h · max. {DASHBOARD_RECENT_QUOTES_PAGE_SIZE} por pagina
          </p>
        </div>
        {!loading && (
          <p className="text-xs font-medium text-slate-500 tabular-nums">
            {totalRows} en periodo
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="dashboard-table-panel dashboard-recent-quotes-scroll min-h-0 flex-1"
          role="region"
          aria-label="Cotizaciones recientes, desliza para ver todas las filas"
          tabIndex={0}
        >
          <QuotesTable
            quotes={quotes}
            loading={loading}
            showVendor
            readOnlyStatus
            statusBadge={statusBadge}
            money={money}
            emptyMessage={emptyMessage}
            compactRows
          />
        </div>

        {!loading && totalRows > 0 && (
          <div className="mt-2 flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-2">
            <span className="mr-1 text-[11px] text-slate-400 tabular-nums">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Cotizaciones anteriores"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white/90 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Cotizaciones siguientes"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white/90 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function QuotesTable({
  quotes,
  loading,
  showVendor,
  showContact = false,
  readOnlyStatus = false,
  canEditStatus,
  statusUpdatingId,
  onStatusChange,
  statusBadge,
  money,
  emptyMessage = "Aun no hay cotizaciones guardadas.",
  compactRows = false,
}) {
  const rowCellClass = compactRows ? "py-2" : "py-2.5";

  if (loading) {
    return <p className="py-6 text-center text-sm text-slate-500">Cargando cotizaciones...</p>;
  }

  if (!quotes.length) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="table-scroll-touch quotes-table-scroll overflow-x-auto">
      <table
        className={`w-full text-left text-sm ${
          showContact && showVendor
            ? "min-w-[900px]"
            : showContact
              ? "min-w-[760px]"
              : showVendor
                ? "min-w-[720px]"
                : "min-w-[640px]"
        }`}
      >
        <thead className="sticky top-0 z-[1] bg-white text-xs uppercase text-slate-500">
          <tr>
            <th className="pb-2">Folio</th>
            <th className="pb-2">Fecha</th>
            <th className="pb-2">Cliente</th>
            {showContact && <th className="pb-2">Contacto</th>}
            {showVendor && <th className="pb-2">Vendedor</th>}
            <th className="pb-2">Volumen</th>
            <th className="pb-2">Monto</th>
            <th className="pb-2">Estatus</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-t border-slate-100">
              <td className={`${rowCellClass} font-semibold`}>{quote.folio}</td>
              <td>{quote.fecha}</td>
              <td>{quote.cliente}</td>
              {showContact && <td className="whitespace-nowrap tabular-nums">{formatContactPhone(quote.whatsappCliente)}</td>}
              {showVendor && (
                <td className="font-medium text-slate-800">{quote.vendedorNombre ?? "—"}</td>
              )}
              <td>{formatVolume(Number(quote.volumen) || 0)}</td>
              <td>{money(Number(quote.total) || 0)}</td>
              <td>
                {readOnlyStatus || (canEditStatus && !canEditStatus(quote)) ? (
                  <span className={`inline-flex ${statusBadge(quote.status)}`}>
                    {normalizeCotizacionEstatus(quote.status)}
                  </span>
                ) : (
                  <select
                    value={quote.status}
                    disabled={statusUpdatingId === quote.id}
                    onChange={(event) => onStatusChange(quote.id, event.target.value)}
                    className={statusBadge(quote.status)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPlantaFilters({ value, onChange, className = "" }) {
  return (
    <div className={`dashboard-planta-filters flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Filtro de planta
      </p>
      <div className="dashboard-planta-filters__buttons grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => onChange("general")}
          className={`${dashboardPlantaFilterButtonClass} ${dashboardPlantaFilterButtonVariantClass("general", value === "general")}`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => onChange(EMPRESA_IDS.TEPEXI)}
          className={`${dashboardPlantaFilterButtonClass} ${dashboardPlantaFilterButtonVariantClass("tepexi", value === EMPRESA_IDS.TEPEXI)}`}
        >
          Tepexi
        </button>
        <button
          type="button"
          onClick={() => onChange(EMPRESA_IDS.NARVAEZ)}
          className={`${dashboardPlantaFilterButtonClass} ${dashboardPlantaFilterButtonVariantClass("narvaez", value === EMPRESA_IDS.NARVAEZ)}`}
        >
          Narvaez
        </button>
      </div>
    </div>
  );
}

function VendorLeaderboard({
  rows,
  page,
  totalPages,
  totalRows,
  onPageChange,
  loading,
  plantaFilter,
}) {
  const filterLabel =
    plantaFilter === "general" ? "todas las plantas" : getPlantaLabel(plantaFilter);

  return (
    <article className={`vendor-leaderboard-card ${cardClass} mt-4 min-w-0`}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Rendimiento por vendedor
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Leaderboard · {filterLabel} · {LEADERBOARD_PAGE_SIZE} por pagina
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          {loading ? "Cargando..." : `${totalRows} vendedores`}
        </p>
      </div>

      <div
        className="dashboard-table-panel vendor-leaderboard-scroll"
        role="region"
        aria-label="Rendimiento por vendedor, desliza para ver todas las filas"
        tabIndex={0}
      >
        <div className="vendor-leaderboard-frame">
          <table className="vendor-leaderboard-table text-center text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-5 pb-3 pt-3">Vendedor</th>
              <th className="px-5 pb-3 pt-3">Planta</th>
              <th className="px-5 pb-3 pt-3">Cotiz.</th>
              <th className="px-5 pb-3 pt-3">Monto cerradas</th>
              <th className="px-5 pb-3 pt-3">Estatus</th>
              <th className="px-5 pb-3 pt-3">Eficiencia</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Cargando ranking...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Sin vendedores para este filtro.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.vendorKey} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-semibold">{row.vendedorNombre}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border-2 px-2 py-0.5 text-xs font-semibold ${getPlantaBadgeClass(row.empresaId)}`}
                    >
                      {row.planta}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{row.totalCotizaciones}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums text-emerald-800">
                    {money(row.montoCerradas)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Cerradas {row.cerradas}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                        Pend. {row.pendientes}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex min-w-[3rem] justify-center rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${getPlantaEficienciaClass(row.empresaId)}`}
                    >
                      {row.eficienciaPct}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {!loading && totalRows > 0 && (
        <div className="leaderboard-pagination mt-4 flex w-full min-w-0 flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Pagina anterior"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Pagina siguiente"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Pagina {page} de {totalPages}
          </p>
        </div>
      )}
    </article>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-[var(--brand)] transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className={`flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)] disabled:cursor-not-allowed"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function DualBrandLogos({ size = "admin", className = "", priority = false }) {
  const isLogin = size === "login";
  const isAdmin = size === "admin";

  const loginSlotClass =
    "flex h-14 w-[6.5rem] items-center justify-center lg:h-[4.75rem] lg:w-[8.5rem]";
  const loginTepexiSlotClass =
    "flex h-12 w-[5.5rem] items-center justify-center lg:h-[4.25rem] lg:w-[7rem]";
  const loginImageClass = "max-h-full max-w-full object-contain";
  const adminImageClass = "header-logo-img h-10 w-auto max-h-10 object-contain lg:h-14 lg:max-h-14";
  const compactImageClass = "h-9 w-auto object-contain";

  const dividerClass = isLogin
    ? "h-14 w-px shrink-0 bg-slate-300/80 sm:h-[4.25rem]"
    : isAdmin
      ? "h-11 w-px shrink-0 bg-slate-300/80 sm:h-12"
      : "h-8 w-px shrink-0 bg-slate-300/70";

  const renderLogo = (src, alt, { rounded = false, compact = false } = {}) => {
    const imageClass = isLogin
      ? loginImageClass
      : isAdmin
        ? `${adminImageClass}${rounded ? " rounded" : ""}`
        : `${compactImageClass}${rounded ? " rounded" : ""}`;

    if (isLogin) {
      return (
        <div className={compact ? loginTepexiSlotClass : loginSlotClass}>
          <Image
            src={src}
            alt={alt}
            width={160}
            height={76}
            className={imageClass}
            priority={priority}
          />
        </div>
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={150}
        height={70}
        className={imageClass}
        priority={priority}
      />
    );
  };

  return (
    <div
      className={`flex shrink-0 items-center ${
        isLogin ? "dual-brand-logos--login justify-center gap-3 lg:gap-5" : "dual-brand-logos--header gap-2 lg:gap-3"
      } ${className}`}
    >
      {renderLogo("/Logo-CN-Color.png", "Concretos Narváez")}
      <span className={`${dividerClass} rounded-full`} aria-hidden="true" />
      {renderLogo("/logo-tepexi.jpeg", "Concretos Tepexi", { rounded: true, compact: isLogin })}
    </div>
  );
}

function HeaderLogo({ tenant, large = false, xlarge = false, className = "" }) {
  const singleLogoClass = xlarge ? "header-logo-img h-12 lg:h-16" : large ? "header-logo-img h-10 lg:h-14" : "header-logo-img h-9";

  if (tenant.logo) {
    return (
      <Image
        src={tenant.logo}
        alt={tenant.name}
        width={xlarge ? 180 : large ? 156 : 120}
        height={xlarge ? 62 : large ? 54 : 42}
        className={`w-auto shrink-0 rounded object-contain ${singleLogoClass} ${className}`}
      />
    );
  }

  return <DualBrandLogos size="admin" className={className} />;
}

function MetricCard({ title, value, icon }) {
  return (
    <article className={cardClass}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-soft)]">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-base font-bold leading-snug text-slate-900 break-words sm:text-lg">{value}</p>
    </article>
  );
}

function Bar({ label, fullLabel, height, value, front, side, top }) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-1 px-0.5" title={fullLabel}>
      <div className="whitespace-nowrap text-[10px] font-bold leading-tight text-slate-700">{value}</div>
      <div className={`relative ${height} w-9`}>
        <div
          className="absolute -top-1.5 left-0 z-20 h-2 w-9 -skew-x-[35deg] rounded-sm shadow-sm"
          style={{ background: top }}
        />
        <div
          className="absolute bottom-0 left-0 z-10 h-full w-9 rounded-t-md shadow-[inset_-2px_0_8px_rgba(255,255,255,0.22)]"
          style={{ background: front }}
        />
        <div
          className="absolute bottom-0 left-9 z-10 h-full w-2 rounded-tr-sm shadow-md"
          style={{ background: side }}
        />
        <div className="absolute -bottom-0.5 left-0.5 h-1.5 w-10 rounded-full bg-slate-400/25 blur-[1px]" />
      </div>
      <div className="max-w-[2.75rem] truncate text-center text-[10px] font-medium leading-tight text-slate-600">
        {label}
      </div>
    </div>
  );
}
