import Image from "next/image";
import { notFound } from "next/navigation";
import { formatMexicoDateLong } from "@/lib/dates/mexico";
import { getCotizacionByFolio } from "@/lib/supabase/cotizaciones";
import { getTenant } from "@/lib/tenants/themes";
import PrintTrigger from "./PrintTrigger";

const money = (value) =>
  Number(value).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

export default async function QuotePdfPage({ params, searchParams }) {
  const { folio } = await params;
  const { print } = await searchParams;
  const quote = await getCotizacionByFolio(folio);

  if (!quote) {
    notFound();
  }

  const tenant = getTenant(quote.empresa_id);
  const fecha = quote.creado_at ? formatMexicoDateLong(quote.creado_at) : "—";

  return (
    <main className={`quote-pdf-document min-h-screen bg-white text-slate-900 ${tenant.themeClass}`}>
      {print === "1" && <PrintTrigger />}
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 print:px-0 print:py-0">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {tenant.logo ? (
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={180}
                height={64}
                className="h-14 w-auto object-contain"
                priority
              />
            ) : (
              <p className="text-xl font-bold text-[var(--brand)]">{tenant.name}</p>
            )}
            <p className="mt-2 text-sm text-slate-600">Cotizacion de concreto premezclado</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Folio</p>
            <p className="text-2xl font-bold text-slate-900">{quote.folio_institucional}</p>
            <p className="mt-2 text-sm text-slate-600">{fecha}</p>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{quote.nombre_cliente}</p>
            {quote.solicitante && (
              <p className="mt-1 text-sm text-slate-600">Atencion: {quote.solicitante}</p>
            )}
            {quote.whatsapp_cliente && (
              <p className="mt-1 text-sm text-slate-600">WhatsApp: {quote.whatsapp_cliente}</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Ubicacion</p>
            <p className="mt-1 text-base font-semibold text-slate-900">CP {quote.codigo_postal}</p>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            Especificacion del concreto
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Volumen</dt>
              <dd className="font-semibold text-slate-900">{quote.volumen_m3} m3</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Resistencia</dt>
              <dd className="font-semibold text-slate-900">{quote.resistencia}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Edad</dt>
              <dd className="font-semibold text-slate-900">{quote.edad}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Revenimiento</dt>
              <dd className="font-semibold text-slate-900">{quote.revenimiento}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Adicionante</dt>
              <dd className="font-semibold text-slate-900">{quote.aditivo || "Ninguno"}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Totales</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{money(quote.subtotal)}</span>
            </li>
            {Number(quote.descuento_porcentaje) > 0 && (
              <li className="flex justify-between">
                <span>Descuento ({quote.descuento_porcentaje}%)</span>
                <span className="font-semibold text-red-600">
                  - {money((quote.subtotal * quote.descuento_porcentaje) / 100)}
                </span>
              </li>
            )}
            <li className="flex justify-between">
              <span>IVA (16%)</span>
              <span className="font-semibold">{money(quote.iva)}</span>
            </li>
            <li className="flex justify-between rounded-lg bg-slate-900 px-3 py-2 text-base font-bold text-white">
              <span>Total</span>
              <span>{money(quote.total)}</span>
            </li>
          </ul>
        </section>

        <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Documento generado electronicamente por {tenant.name}. Validez sujeta a condiciones comerciales vigentes.
        </footer>
      </article>
    </main>
  );
}
