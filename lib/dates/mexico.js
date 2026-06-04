/** Zona horaria de operacion (Puebla / Mexico). */
export const MEXICO_TZ = "America/Mexico_City";

/**
 * Convierte un instante UTC a componentes de calendario en Mexico.
 * Devuelve un Date con esos componentes (para aritmetica de dias locales).
 */
export function toMexicoLocalDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
}

export function formatMexicoDayKey(mexicoLocalDate) {
  const year = mexicoLocalDate.getFullYear();
  const month = String(mexicoLocalDate.getMonth() + 1).padStart(2, "0");
  const day = String(mexicoLocalDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Clave YYYY-MM-DD segun calendario de Mexico. */
export function getMexicoDayKey(dateInput) {
  const mexico = toMexicoLocalDate(dateInput);
  if (!mexico) return null;
  return formatMexicoDayKey(mexico);
}

export function todayMexicoDayKey() {
  return getMexicoDayKey(new Date());
}

export function mexicoDayKeyDaysAgo(offset) {
  const mexico = toMexicoLocalDate(new Date());
  if (!mexico) return null;
  mexico.setDate(mexico.getDate() - offset);
  return formatMexicoDayKey(mexico);
}

/** Fecha corta d/m/aaaa para tablas y listados. */
export function formatMexicoDateShort(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-MX", {
    timeZone: MEXICO_TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

/** Fecha larga para encabezados (ej. 3 de junio de 2026). */
export function formatMexicoDateLong(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-MX", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Parsea fecha mostrada d/m/aaaa (es-MX) a clave YYYY-MM-DD. */
export function parseMexicoDisplayDateToDayKey(fecha) {
  if (typeof fecha !== "string" || !fecha.includes("/")) return null;

  const [day, month, year] = fecha.split("/").map((part) => part.trim());
  if (!day || !month || !year) return null;

  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function isQuoteInMexicoWeek(creadoAt) {
  const quoteKey = getMexicoDayKey(creadoAt);
  if (!quoteKey) return false;

  for (let offset = 0; offset < 7; offset += 1) {
    if (mexicoDayKeyDaysAgo(offset) === quoteKey) return true;
  }

  return false;
}
