"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  FilePlus,
  Gauge,
  HardHat,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { getTenant, NEUTRAL_TENANT } from "@/lib/tenants/themes";

const IVA = 0.16;

const MOCK_DASHBOARD_METRICS = {
  totalVolume: 1240,
  totalAmount: 2480000,
  sentCount: 45,
  closedCount: 28,
};

const MOCK_VENDOR_CHART_BARS = [
  {
    label: "Vendedor 1",
    height: "h-40",
    value: "$940k",
    front: "linear-gradient(180deg, #fb923c 0%, #ea580c 52%, #c2410c 100%)",
    side: "#9a3412",
    top: "#fdba74",
  },
  {
    label: "Vendedor 2",
    height: "h-32",
    value: "$780k",
    front: "linear-gradient(180deg, #64748b 0%, #475569 52%, #334155 100%)",
    side: "#1e293b",
    top: "#94a3b8",
  },
  {
    label: "Vendedor 3",
    height: "h-24",
    value: "$560k",
    front: "linear-gradient(180deg, #fbbf24 0%, #d97706 52%, #b45309 100%)",
    side: "#92400e",
    top: "#fde68a",
  },
];

const MOCK_QUOTES = [
  {
    id: "demo-1",
    folio: "V1-297",
    fecha: "22/05/2026",
    cliente: "Obra Alfa",
    vendedorNombre: "Vendedor Demo",
    vendedorEmail: "vendedor@concretos.com",
    volumen: 24,
    total: 182000,
    status: "Cerrada",
  },
  {
    id: "demo-2",
    folio: "V1-298",
    fecha: "23/05/2026",
    cliente: "Consorcio Norte",
    vendedorNombre: "Vendedor Demo",
    vendedorEmail: "vendedor@concretos.com",
    volumen: 12,
    total: 95400,
    status: "Pendiente",
  },
  {
    id: "demo-3",
    folio: "V1-299",
    fecha: "24/05/2026",
    cliente: "Residencial Delta",
    vendedorNombre: "Vendedor 3",
    vendedorEmail: "vendedor3@concretos.com",
    volumen: 30,
    total: 133200,
    status: "Cerrada",
  },
  {
    id: "demo-4",
    folio: "V1-296",
    fecha: "21/05/2026",
    cliente: "Grupo Horizonte",
    vendedorNombre: "Vendedor 2",
    vendedorEmail: "vendedor2@concretos.com",
    volumen: 18,
    total: 168500,
    status: "Pendiente",
  },
  {
    id: "demo-5",
    folio: "V1-295",
    fecha: "20/05/2026",
    cliente: "Constructora Atlas",
    vendedorNombre: "Vendedor Demo",
    vendedorEmail: "vendedor@concretos.com",
    volumen: 20,
    total: 145600,
    status: "Cerrada",
  },
];

const cardClass =
  "rounded-2xl bg-white p-4 shadow ring-1 ring-slate-200 border-l-4 border-[var(--brand)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg";

const logoutButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all duration-150 hover:bg-red-100 active:translate-y-0.5 active:scale-[0.98] active:border-red-400 active:bg-red-200 active:shadow-inner";

const newQuoteButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:bg-[var(--brand-strong)] active:translate-y-0.5 active:scale-[0.98] active:bg-[var(--brand-strong)] active:shadow-md";

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
  Ninguno: 0,
  "Fibra de polipropileno": 150,
  Impermeabilizante: 100,
};

const additiveOptions = Object.keys(additiveCost);

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

function formatDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDayKey() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return formatDayKey(today);
}

function buildLast7DayTabs() {
  const tabs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = formatDayKey(date);

    const day = date.getDate();
    const month = date.toLocaleDateString("es-MX", { month: "short" }).toUpperCase();
    const datePart = `${day} ${month}`;
    const weekday = date.toLocaleDateString("es-MX", { weekday: "short" });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    let label;
    if (offset === 0) label = `Hoy | ${datePart}`;
    else if (offset === 1) label = `Ayer | ${datePart}`;
    else label = `${capitalizedWeekday} | ${datePart}`;

    tabs.push({
      key,
      label,
    });
  }

  return tabs;
}

function getQuoteDayKey(quote) {
  if (quote.creadoAt) {
    const parsed = new Date(quote.creadoAt);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return formatDayKey(parsed);
    }
  }

  if (typeof quote.fecha === "string" && quote.fecha.includes("/")) {
    const [day, month, year] = quote.fecha.split("/");
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
}

function formatVolume(value) {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} m3`;
}

function normalizeWhatsAppPhone(value) {
  return value.replace(/\D/g, "").slice(0, 10);
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
  const [aditivo, setAditivo] = useState("Ninguno");

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
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [demoQuotes, setDemoQuotes] = useState(MOCK_QUOTES);
  const [seguimientoQuotes, setSeguimientoQuotes] = useState([]);
  const [seguimientoLoading, setSeguimientoLoading] = useState(false);
  const [seguimientoDayKey, setSeguimientoDayKey] = useState(todayDayKey);

  const fechaActual = useMemo(
    () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  const vendedorNombre = useMemo(
    () => sessionUser?.name || nombreDesdeEmail(email),
    [sessionUser, email]
  );

  // Tema activo segun la empresa del perfil autenticado.
  // Antes de iniciar sesion (o para la dirección) el tema es neutral.
  const tenant = useMemo(() => getTenant(sessionUser?.empresa), [sessionUser]);
  const themeClass = sessionUser ? tenant.themeClass : NEUTRAL_TENANT.themeClass;

  const loadSeguimientoQuotes = async () => {
    setSeguimientoLoading(true);
    try {
      const response = await fetch("/api/quotes");
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

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          setView("login");
          return;
        }

        const data = await response.json();
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
    const additiveRate = additiveCost[aditivo] ?? 0;
    const additiveSubtotal = baseM3 > 0 && aditivo !== "Ninguno" ? additiveRate * baseM3 : 0;
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
    aditivo,
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

  const statusBadge = (status) =>
    status === "Cerrada"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
      : "bg-amber-100 text-amber-700 border-amber-300";

  const handleLogin = async (event) => {
    event?.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Credenciales invalidas.");
        return;
      }

      setSessionUser(data.user);
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
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
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

    setIsSavingQuote(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          solicitante,
          whatsappCliente: phone,
          cp,
          volumen: priceModel.baseM3,
          resistencia,
          edad,
          revenimiento,
          aditivo,
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

    setDocumentActionsOpen(true);

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

  const handleUpdateDemoQuoteStatus = (quoteId, status) => {
    setStatusUpdatingId(quoteId);
    setDemoQuotes((current) =>
      current.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote))
    );
    setStatusUpdatingId(null);
  };

  const handleUpdateSeguimientoQuoteStatus = async (quoteId, status) => {
    setStatusUpdatingId(quoteId);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
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
    setAditivo("Ninguno");
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
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-sm font-medium text-slate-600">Cargando plataforma...</p>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-slate-100 text-slate-900 ${themeClass}`}>
      {sessionUser && (
        <div className="fixed bottom-3 right-3 z-50 flex gap-2 rounded-full bg-white/90 p-1 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <button
            onClick={() => setView("cotizador")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "cotizador" ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Cotizador
          </button>
          <button
            onClick={() => {
              setSeguimientoDayKey(todayDayKey());
              setView("seguimiento");
              loadSeguimientoQuotes();
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "seguimiento" ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Seguimiento
          </button>
          {sessionUser.role === "admin" && (
            <button
              onClick={() => setView("dashboard")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === "dashboard" ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Dashboard
            </button>
          )}
        </div>
      )}

      {view === "login" && (
        <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
          <div className="rounded-2xl border-l-4 border-slate-800 bg-white p-6 shadow-xl ring-1 ring-slate-200 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="mb-7 text-center">
              <div className="logos-frame-glow mx-auto mb-8 flex h-28 w-full items-stretch rounded-3xl bg-slate-50 px-2">
                <div className="flex flex-1 items-center justify-center px-3">
                  <Image
                    src="/Logo-CN-Color.png"
                    alt="Concretos Narváez"
                    width={150}
                    height={70}
                    className="h-12 w-auto object-contain"
                    priority
                  />
                </div>
                <span className="my-4 w-0.5 self-stretch rounded-full bg-slate-300" aria-hidden="true" />
                <div className="flex flex-1 items-center justify-center px-3">
                  <Image
                    src="/logo-tepexi.jpeg"
                    alt="Concretos Tepexi"
                    width={150}
                    height={70}
                    className="h-14 w-auto rounded object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
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
        <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <header className={`mb-4 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <HeaderLogo tenant={tenant} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className="text-sm font-semibold text-slate-800">{vendedorNombre}</p>
                    <p className="text-xs font-semibold text-[var(--brand)]">{tenant.name}</p>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cotizador de Concreto Premezclado</h2>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <button onClick={handleLogout} className={logoutButtonClass}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
                <div className="grid grid-cols-2 gap-2 sm:w-[340px]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Fecha</p>
                    <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      {fechaActual}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Folio</p>
                    <p className="text-sm font-semibold text-slate-800">{displayFolio}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Users className="h-4 w-4 text-[var(--brand)]" />
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
                    <span className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Phone className="h-4 w-4 text-[var(--brand)]" />
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
                  <MapPin className="h-4 w-4 text-[var(--brand)]" />
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
                  <HardHat className="h-4 w-4 text-[var(--brand)]" />
                  Paso 3 - Configuracion del concreto
                </h3>
                <label className="volume-field-wrap mb-4 block rounded-xl border-2 p-3">
                  <span className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <Truck className="h-4 w-4 text-[var(--brand)]" />
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
                  <SelectField label="Adicionante" value={aditivo} onChange={setAditivo} options={additiveOptions} disabled={formLocked} />
                </div>
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <ListChecks className="h-4 w-4 text-[var(--brand)]" />
                  Paso 4 - Servicios extra
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
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

            <aside className="quote-print-area lg:col-span-2">
              <article className={`sticky top-4 ${cardClass}`}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Banknote className="h-4 w-4 text-[var(--brand)]" />
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
                  <li className="flex justify-between">
                    <span>Concreto base</span>
                    <span className="font-semibold">{money(priceModel.concreteSubtotal)}</span>
                  </li>
                  {priceModel.ageSubtotal > 0 && (
                    <li className="flex justify-between">
                      <span>
                        {edad} ({money(priceModel.ageRate)} / m3)
                      </span>
                      <span className="font-semibold">{money(priceModel.ageSubtotal)}</span>
                    </li>
                  )}
                  {priceModel.additiveSubtotal > 0 && (
                    <li className="flex justify-between">
                      <span>
                        {aditivo} ({money(priceModel.additiveRate)} / m3)
                      </span>
                      <span className="font-semibold">{money(priceModel.additiveSubtotal)}</span>
                    </li>
                  )}
                  <li className="flex justify-between">
                    <span>Servicios extra</span>
                    <span className="font-semibold">{money(priceModel.extrasSubtotal)}</span>
                  </li>
                  {priceModel.vacioSubtotal > 0 && (
                    <li className="flex justify-between">
                      <span>Cargo por vacio ({priceModel.vacioM3} m3)</span>
                      <span className="font-semibold">{money(priceModel.vacioSubtotal)}</span>
                    </li>
                  )}
                  {priceModel.distanciaSubtotal > 0 && (
                    <li className="flex justify-between">
                      <span>Cargo por distancia</span>
                      <span className="font-semibold">{money(priceModel.distanciaSubtotal)}</span>
                    </li>
                  )}
                  <li className="flex justify-between border-t border-slate-200 pt-2">
                    <span>Subtotal</span>
                    <span className="font-semibold">{money(priceModel.subtotal)}</span>
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

                <div className="no-print mt-4 grid grid-cols-2 gap-2">
                  {!emittedQuote && (
                    <button
                      onClick={handleEmitQuote}
                      disabled={isSavingQuote}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <FilePlus className="h-4 w-4" />
                      {isSavingQuote ? "Emitiendo..." : "Emitir Cotizacion"}
                    </button>
                  )}
                  <button
                    onClick={handleWhatsApp}
                    disabled={isSavingQuote}
                    className={`flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 ${emittedQuote ? "col-span-2" : ""}`}
                  >
                    <Send className="h-4 w-4" />
                    {isSavingQuote ? "Procesando..." : "Enviar por WhatsApp"}
                  </button>
                </div>
                {emittedQuote && (
                  <p className="no-print mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Cotizacion {emittedQuote.folio_institucional} registrada. Precios congelados.
                  </p>
                )}
                {saveError && (
                  <p className="no-print mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
                )}
              </article>
            </aside>
          </div>
        </section>
      )}

      {view === "seguimiento" && sessionUser && (
        <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <header className={`mb-4 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <HeaderLogo tenant={tenant} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className="text-sm font-semibold text-slate-800">{vendedorNombre}</p>
                    <p className="text-xs font-semibold text-[var(--brand)]">{tenant.name}</p>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Seguimiento de cotizaciones</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button onClick={handleLogout} className={logoutButtonClass}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
                <button
                  onClick={() => {
                    resetQuoteForm();
                    setView("cotizador");
                  }}
                  className={newQuoteButtonClass}
                >
                  <FilePlus className="h-4 w-4" />
                  + Nueva Cotizacion
                </button>
              </div>
            </div>
          </header>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <MetricCard
              title="Mis cotizaciones"
              value={`${seguimientoQuotes.length} registradas`}
              icon={<ListChecks className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Pendientes"
              value={`${seguimientoQuotes.filter((quote) => quote.status === "Pendiente").length}`}
              icon={<ClipboardList className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Cerradas"
              value={`${seguimientoQuotes.filter((quote) => quote.status === "Cerrada").length}`}
              icon={<CheckCircle2 className="h-5 w-5 text-[var(--brand)]" />}
            />
          </div>

          <article className={`${cardClass} overflow-hidden`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                <ListChecks className="h-4 w-4 text-[var(--brand)]" />
                Mis cotizaciones
              </h3>
              {activeSeguimientoTab && (
                <p className="text-xs font-medium text-slate-500">
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
                showVendor={false}
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
        <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <header className={`mb-4 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <HeaderLogo tenant={tenant} />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Dashboard de gerencia</p>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Administrador</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button onClick={handleLogout} className={logoutButtonClass}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
                <button onClick={() => setView("cotizador")} className={newQuoteButtonClass}>
                  <FilePlus className="h-4 w-4" />
                  + Nueva Cotizacion
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              title="Volumen Total Cotizado"
              value={formatVolume(MOCK_DASHBOARD_METRICS.totalVolume)}
              icon={<Gauge className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Monto Total Cotizado"
              value={money(MOCK_DASHBOARD_METRICS.totalAmount)}
              icon={<BarChart3 className="h-5 w-5 text-[var(--brand)]" />}
            />
            <MetricCard
              title="Cotizaciones del Mes"
              value={`${MOCK_DASHBOARD_METRICS.sentCount} enviadas / ${MOCK_DASHBOARD_METRICS.closedCount} cerradas`}
              icon={<Phone className="h-5 w-5 text-[var(--brand)]" />}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <article className={`${cardClass} lg:col-span-1`}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Rendimiento por vendedor</h3>
              <div className="flex h-56 items-end justify-around gap-4 px-2 pb-2">
                {MOCK_VENDOR_CHART_BARS.map((bar) => (
                  <Bar key={bar.label} {...bar} />
                ))}
              </div>
            </article>

            <article className={`${cardClass} lg:col-span-2`}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Cotizaciones recientes</h3>
              <QuotesTable
                quotes={demoQuotes}
                loading={false}
                showVendor
                statusUpdatingId={statusUpdatingId}
                onStatusChange={handleUpdateDemoQuoteStatus}
                statusBadge={statusBadge}
                money={money}
              />
            </article>
          </div>
        </section>
      )}

      {documentActionsOpen && emittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
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
                onClick={handleDownloadPdf}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                Descargar PDF
              </button>
              <button
                onClick={handlePrintEmitted}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir Ahora
              </button>
              <button
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
        className="flex gap-1.5 overflow-x-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`group relative min-w-[5.75rem] shrink-0 rounded-t-xl border px-2.5 pb-2 pt-2 text-left transition-all duration-200 sm:min-w-[6.5rem] sm:px-3 ${
                active
                  ? "z-10 -mb-px border-[var(--brand)] border-b-white bg-white shadow-[0_-4px_18px_rgba(15,23,42,0.08)]"
                  : "border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 hover:border-slate-300 hover:from-white hover:to-slate-50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className={`text-xs font-bold leading-tight ${active ? "text-slate-900" : "text-slate-600"}`}>
                  {tab.label}
                </p>
                <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-orange-700 ring-1 ring-orange-200/80">
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

      <div className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}

function QuotesTable({
  quotes,
  loading,
  showVendor,
  statusUpdatingId,
  onStatusChange,
  statusBadge,
  money,
  emptyMessage = "Aun no hay cotizaciones guardadas.",
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Cargando cotizaciones...</p>;
  }

  if (!quotes.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="pb-2">Folio</th>
            <th className="pb-2">Fecha</th>
            <th className="pb-2">Cliente</th>
            {showVendor && <th className="pb-2">Vendedor</th>}
            <th className="pb-2">Volumen</th>
            <th className="pb-2">Monto</th>
            <th className="pb-2">Estatus</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-t border-slate-100">
              <td className="py-2.5 font-semibold">{quote.folio}</td>
              <td>{quote.fecha}</td>
              <td>{quote.cliente}</td>
              {showVendor && <td>{quote.vendedorNombre}</td>}
              <td>{formatVolume(Number(quote.volumen) || 0)}</td>
              <td>{money(Number(quote.total) || 0)}</td>
              <td>
                <select
                  value={quote.status}
                  disabled={statusUpdatingId === quote.id}
                  onChange={(event) => onStatusChange(quote.id, event.target.value)}
                  className={`rounded-full border px-2 py-1 text-xs font-semibold outline-none ring-[var(--brand)] transition focus:ring-2 disabled:opacity-60 ${statusBadge(quote.status)}`}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <label className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
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

function HeaderLogo({ tenant }) {
  if (tenant.logo) {
    return (
      <Image
        src={tenant.logo}
        alt={tenant.name}
        width={120}
        height={42}
        className="h-9 w-auto rounded object-contain"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {tenant.logos.map((src) => (
        <Image
          key={src}
          src={src}
          alt={tenant.name}
          width={90}
          height={36}
          className="h-8 w-auto rounded object-contain"
        />
      ))}
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <article className={cardClass}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-soft)]">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </article>
  );
}

function Bar({ label, height, value, front, side, top }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-bold text-slate-700">{value}</div>
      <div className={`relative ${height} w-[3.75rem]`}>
        <div
          className="absolute -top-2 left-0 z-20 h-2.5 w-12 -skew-x-[35deg] rounded-sm shadow-sm"
          style={{ background: top }}
        />
        <div
          className="absolute bottom-0 left-0 z-10 h-full w-12 rounded-t-lg shadow-[inset_-3px_0_10px_rgba(255,255,255,0.22)]"
          style={{ background: front }}
        />
        <div
          className="absolute bottom-0 left-12 z-10 h-full w-3 rounded-tr-md shadow-md"
          style={{ background: side }}
        />
        <div className="absolute -bottom-1 left-1 h-2 w-14 rounded-full bg-slate-400/25 blur-[2px]" />
      </div>
      <div className="text-xs font-medium text-slate-600">{label}</div>
    </div>
  );
}
