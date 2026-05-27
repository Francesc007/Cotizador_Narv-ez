"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FilePlus,
  Gauge,
  HardHat,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Percent,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

const IVA = 0.16;

const chartPalette = [
  {
    front: "linear-gradient(180deg, #fb923c 0%, #ea580c 52%, #c2410c 100%)",
    side: "#9a3412",
    top: "#fdba74",
  },
  {
    front: "linear-gradient(180deg, #64748b 0%, #475569 52%, #334155 100%)",
    side: "#1e293b",
    top: "#94a3b8",
  },
  {
    front: "linear-gradient(180deg, #fbbf24 0%, #d97706 52%, #b45309 100%)",
    side: "#92400e",
    top: "#fde68a",
  },
];

const chartHeights = ["h-40", "h-32", "h-24"];

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
  "rounded-2xl bg-white p-4 shadow ring-1 ring-slate-200 border-l-4 border-orange-600 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg";

const logoutButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all duration-150 hover:bg-red-100 active:translate-y-0.5 active:scale-[0.98] active:border-red-400 active:bg-red-200 active:shadow-inner";

const newQuoteButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition-all duration-150 hover:bg-orange-700 active:translate-y-0.5 active:scale-[0.98] active:bg-orange-800 active:shadow-md";

const resistanceOptions = ["f'c 100", "f'c 200", "f'c 250", "MR 35"];
const ageOptions = ["Normal 28 dias", "14 Dias", "7 Dias"];
const slumpOptions = ["14 cm", "18 cm"];
const additiveOptions = ["Ninguno", "Impermeabilizante", "Fluido"];

const resistanceFactor = {
  "f'c 100": 1,
  "f'c 200": 1.1,
  "f'c 250": 1.2,
  "MR 35": 1.25,
};

const additiveCost = {
  Ninguno: 0,
  Impermeabilizante: 180,
  Fluido: 240,
};

const extraServiceCost = {
  bombaEstacionaria: 1800,
  bombaPluma: 3200,
  domingo: 900,
  nocturno: 750,
};

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

function buildVendorBars(quotes) {
  const totals = new Map();

  for (const quote of quotes) {
    if (quote.status !== "Cerrada") continue;
    const label = quote.vendedorNombre || "Sin asignar";
    totals.set(label, (totals.get(label) || 0) + quote.total);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const max = sorted[0]?.[1] || 1;

  return sorted.map(([label, amount], index) => ({
    label,
    value: money(amount),
    height: chartHeights[index] || "h-20",
    ...chartPalette[index % chartPalette.length],
    amountRatio: amount / max,
  }));
}

function formatVolume(value) {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} m3`;
}

export default function Page() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cliente, setCliente] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [cp, setCp] = useState("");

  const [volumen, setVolumen] = useState(24);
  const [resistencia, setResistencia] = useState("f'c 200");
  const [edad, setEdad] = useState("Normal 28 dias");
  const [revenimiento, setRevenimiento] = useState("14 cm");
  const [aditivo, setAditivo] = useState("Ninguno");

  const [bombaEstacionaria, setBombaEstacionaria] = useState(false);
  const [bombaPluma, setBombaPluma] = useState(false);
  const [domingo, setDomingo] = useState(false);
  const [nocturno, setNocturno] = useState(false);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [actionModal, setActionModal] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [demoQuotes, setDemoQuotes] = useState(MOCK_QUOTES);

  const fechaActual = useMemo(
    () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  const vendedorNombre = useMemo(
    () => sessionUser?.name || nombreDesdeEmail(email),
    [sessionUser, email]
  );

  const loadQuotes = async () => {
    setQuotesLoading(true);
    try {
      const response = await fetch("/api/quotes");
      if (!response.ok) {
        setQuotes([]);
        return;
      }

      const data = await response.json();
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch {
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
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
        await loadQuotes();
      } catch {
        setView("login");
      } finally {
        setAuthLoading(false);
      }
    }

    loadSession();
  }, []);

  const nextFolio = useMemo(() => {
    const numbers = quotes.map((quote) => {
      const match = quote.folio?.match(/V1-(\d+)/);
      return match ? Number(match[1]) : 0;
    });
    const max = numbers.length ? Math.max(...numbers) : 299;
    return `V1-${max + 1}`;
  }, [quotes]);

  const vendorDemoQuotes = useMemo(
    () => demoQuotes.filter((quote) => quote.vendedorEmail === sessionUser?.email),
    [demoQuotes, sessionUser]
  );

  const priceModel = useMemo(() => {
    const baseM3 = Math.max(0.5, Number(volumen) || 0);
    const baseUnit = 1750;
    const resistanceBoost = resistanceFactor[resistencia] ?? 1;
    const ageBoost = edad === "14 Dias" ? 1.06 : edad === "7 Dias" ? 1.1 : 1;
    const slumpBoost = revenimiento === "18 cm" ? 1.04 : 1;
    const unitPrice = baseUnit * resistanceBoost * ageBoost * slumpBoost;
    const concreteSubtotal = unitPrice * baseM3;
    const additiveSubtotal = additiveCost[aditivo] * baseM3;
    const extrasSubtotal =
      (bombaEstacionaria ? extraServiceCost.bombaEstacionaria : 0) +
      (bombaPluma ? extraServiceCost.bombaPluma : 0) +
      (domingo ? extraServiceCost.domingo : 0) +
      (nocturno ? extraServiceCost.nocturno : 0);
    const subtotal = concreteSubtotal + additiveSubtotal + extrasSubtotal;
    const discount = subtotal * Math.max(0, Math.min(discountPercent, 30)) / 100;
    const taxable = subtotal - discount;
    const iva = taxable * IVA;
    const total = taxable + iva;

    return { baseM3, unitPrice, concreteSubtotal, additiveSubtotal, extrasSubtotal, subtotal, discount, iva, total };
  }, [volumen, resistencia, edad, revenimiento, aditivo, bombaEstacionaria, bombaPluma, domingo, nocturno, discountPercent]);

  const cpDetected = cp.trim() === "72000";

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
      setView(data.user.role === "admin" ? "dashboard" : "cotizador");
      await loadQuotes();
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
    setQuotes([]);
    setView("login");
  };

  const handleSaveQuote = async () => {
    setSaveError("");
    setIsSavingQuote(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          solicitante,
          cp,
          volumen: priceModel.baseM3,
          resistencia,
          total: priceModel.total,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error || "No fue posible guardar la cotizacion.");
        return;
      }

      await loadQuotes();
      setCliente("");
      setSolicitante("");
      setCp("");
      setView("seguimiento");
    } catch {
      setSaveError("No fue posible conectar con el servidor.");
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleUpdateDemoQuoteStatus = (quoteId, status) => {
    setStatusUpdatingId(quoteId);
    setDemoQuotes((current) =>
      current.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote))
    );
    setStatusUpdatingId(null);
  };

  const resetQuoteForm = () => {
    setCliente("");
    setSolicitante("");
    setCp("");
    setVolumen(24);
    setResistencia("f'c 200");
    setEdad("Normal 28 dias");
    setRevenimiento("14 cm");
    setAditivo("Ninguno");
    setBombaEstacionaria(false);
    setBombaPluma(false);
    setDomingo(false);
    setNocturno(false);
    setDiscountPercent(0);
    setSaveError("");
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-sm font-medium text-slate-600">Cargando plataforma...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {sessionUser && (
        <div className="fixed bottom-3 right-3 z-50 flex gap-2 rounded-full bg-white/90 p-1 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <button
            onClick={() => setView("cotizador")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "cotizador" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Cotizador
          </button>
          <button
            onClick={() => setView("seguimiento")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "seguimiento" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Seguimiento
          </button>
          {sessionUser.role === "admin" && (
            <button
              onClick={() => setView("dashboard")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === "dashboard" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Dashboard
            </button>
          )}
        </div>
      )}

      {view === "login" && (
        <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
          <div className="rounded-2xl border-l-4 border-orange-600 bg-white p-6 shadow-xl ring-1 ring-slate-200 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-10 flex h-36 w-[19rem] items-center justify-center rounded-3xl border-2 border-orange-500 bg-orange-50/40 px-4 shadow-[0_0_0_3px_rgba(234,88,12,0.2),0_16px_36px_-18px_rgba(234,88,12,0.75)]">
                <Image
                  src="/Logo-CN-Color.png"
                  alt="Concretos Narvaez"
                  width={260}
                  height={120}
                  className="h-20 w-auto object-contain"
                  priority
                />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
                Plataforma inteligente de cotizaciones
              </p>
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
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>
              </label>

              {loginError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogIn className="h-4 w-4" /> {isSubmitting ? "Validando..." : "Cotizar"}
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
                  <Image
                    src="/Logo-CN-Color.png"
                    alt="Concretos Narvaez"
                    width={120}
                    height={42}
                    className="h-9 w-auto object-contain"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className="text-sm font-semibold text-slate-800">{vendedorNombre}</p>
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
                    <p className="text-sm font-semibold text-slate-800">{nextFolio}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Users className="h-4 w-4 text-orange-600" />
                  Paso 1 - Datos
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Nombre del Cliente</span>
                    <input
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Constructora Atlas"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-orange-500 transition focus:ring-2"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Solicitante</span>
                    <input
                      value={solicitante}
                      onChange={(e) => setSolicitante(e.target.value)}
                      placeholder="Ing. Perez"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-orange-500 transition focus:ring-2"
                    />
                  </label>
                </div>
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  Paso 2 - Ubicacion
                </h3>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Codigo Postal</span>
                  <input
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    placeholder="Escribe 72000 para demo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-orange-500 transition focus:ring-2"
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
                  <HardHat className="h-4 w-4 text-orange-600" />
                  Paso 3 - Configuracion del concreto
                </h3>
                <label className="mb-4 block rounded-xl border-2 border-orange-200 bg-orange-50/60 p-3">
                  <span className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <Gauge className="h-4 w-4 text-orange-600" />
                    Volumen (m3)
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={volumen}
                    onChange={(e) => setVolumen(Number(e.target.value))}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none ring-orange-500 transition focus:ring-2"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="Resistencia" value={resistencia} onChange={setResistencia} options={resistanceOptions} />
                  <SelectField label="Edad" value={edad} onChange={setEdad} options={ageOptions} />
                  <SelectField label="Revenimiento" value={revenimiento} onChange={setRevenimiento} options={slumpOptions} />
                  <SelectField label="Aditivo" value={aditivo} onChange={setAditivo} options={additiveOptions} />
                </div>
              </article>

              <article className={cardClass}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <PackageCheck className="h-4 w-4 text-orange-600" />
                  Paso 4 - Servicios extra
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <CheckOption label="Bomba Estacionaria" checked={bombaEstacionaria} onChange={setBombaEstacionaria} />
                  <CheckOption label="Bomba Pluma" checked={bombaPluma} onChange={setBombaPluma} />
                  <CheckOption label="Servicio en Domingo" checked={domingo} onChange={setDomingo} />
                  <CheckOption label="Horario Nocturno" checked={nocturno} onChange={setNocturno} />
                </div>
              </article>
            </div>

            <aside className="lg:col-span-2">
              <article className={`sticky top-4 ${cardClass}`}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <ClipboardList className="h-4 w-4 text-orange-600" />
                  Paso 5 - Cierre y desglose
                </h3>
                <div className="mb-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Resumen de ticket</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {priceModel.baseM3} m3 x {money(priceModel.unitPrice)} / m3
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex justify-between">
                    <span>Concreto base</span>
                    <span className="font-semibold">{money(priceModel.concreteSubtotal)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Aditivo</span>
                    <span className="font-semibold">{money(priceModel.additiveSubtotal)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Servicios extra</span>
                    <span className="font-semibold">{money(priceModel.extrasSubtotal)}</span>
                  </li>
                  <li className="flex justify-between border-t border-slate-200 pt-2">
                    <span>Subtotal</span>
                    <span className="font-semibold">{money(priceModel.subtotal)}</span>
                  </li>
                </ul>

                <label className="mt-4 block">
                  <span className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                    <Percent className="h-4 w-4 text-orange-600" />
                    Descuento Manual (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-orange-500 transition focus:ring-2"
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

                <div className="mt-4 grid gap-2">
                  <button
                    onClick={handleSaveQuote}
                    disabled={isSavingQuote}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {isSavingQuote ? "Guardando..." : "Guardar cotizacion"}
                  </button>
                  {saveError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
                  )}
                  <button
                    onClick={() => setActionModal("pdf")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Generar Vista Previa PDF
                  </button>
                  <button
                    onClick={() => setActionModal("whatsapp")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
                  >
                    <Send className="h-4 w-4" />
                    Enviar por WhatsApp
                  </button>
                </div>
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
                  <Image
                    src="/Logo-CN-Color.png"
                    alt="Concretos Narvaez"
                    width={120}
                    height={42}
                    className="h-9 w-auto object-contain"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel del vendedor</p>
                    <p className="text-sm font-semibold text-slate-800">{vendedorNombre}</p>
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
              value={`${vendorDemoQuotes.length} registradas`}
              icon={<ListChecks className="h-5 w-5 text-orange-600" />}
            />
            <MetricCard
              title="Pendientes"
              value={`${vendorDemoQuotes.filter((quote) => quote.status === "Pendiente").length}`}
              icon={<ClipboardList className="h-5 w-5 text-orange-600" />}
            />
            <MetricCard
              title="Cerradas"
              value={`${vendorDemoQuotes.filter((quote) => quote.status === "Cerrada").length}`}
              icon={<CheckCircle2 className="h-5 w-5 text-orange-600" />}
            />
          </div>

          <article className={cardClass}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <ListChecks className="h-4 w-4 text-orange-600" />
              Mis cotizaciones
            </h3>
            <QuotesTable
              quotes={vendorDemoQuotes}
              loading={false}
              showVendor={false}
              statusUpdatingId={statusUpdatingId}
              onStatusChange={handleUpdateDemoQuoteStatus}
              statusBadge={statusBadge}
              money={money}
            />
          </article>
        </section>
      )}

      {view === "dashboard" && sessionUser?.role === "admin" && (
        <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <header className={`mb-4 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Image
                    src="/Logo-CN-Color.png"
                    alt="Concretos Narvaez"
                    width={120}
                    height={42}
                    className="h-9 w-auto object-contain"
                  />
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
              icon={<Gauge className="h-5 w-5 text-orange-600" />}
            />
            <MetricCard
              title="Monto Total Cotizado"
              value={money(MOCK_DASHBOARD_METRICS.totalAmount)}
              icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
            />
            <MetricCard
              title="Cotizaciones del Mes"
              value={`${MOCK_DASHBOARD_METRICS.sentCount} enviadas / ${MOCK_DASHBOARD_METRICS.closedCount} cerradas`}
              icon={<Phone className="h-5 w-5 text-orange-600" />}
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

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl ring-1 ring-slate-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-orange-700">
              {actionModal === "pdf" ? <FileText className="h-6 w-6" /> : <Send className="h-6 w-6" />}
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {actionModal === "pdf" ? "Vista previa PDF generada" : "Cotizacion enviada por WhatsApp"}
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {actionModal === "pdf"
                ? "La simulacion del PDF se preparo correctamente para revision."
                : "El cliente recibio la propuesta en su chat de manera inmediata."}
            </p>
            <button
              onClick={() => setActionModal(null)}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
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
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Cargando cotizaciones...</p>;
  }

  if (!quotes.length) {
    return <p className="py-8 text-center text-sm text-slate-500">Aun no hay cotizaciones guardadas.</p>;
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
                  className={`rounded-full border px-2 py-1 text-xs font-semibold outline-none ring-orange-500 transition focus:ring-2 disabled:opacity-60 ${statusBadge(quote.status)}`}
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
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-orange-500 transition focus:ring-2"
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
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <article className={cardClass}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-200">{icon}</div>
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
