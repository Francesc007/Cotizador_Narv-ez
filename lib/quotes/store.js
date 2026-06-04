import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { formatMexicoDateShort } from "@/lib/dates/mexico";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(QUOTES_FILE);
  } catch {
    await fs.writeFile(QUOTES_FILE, "[]", "utf8");
  }
}

async function readQuotes() {
  await ensureStore();
  const raw = await fs.readFile(QUOTES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeQuotes(quotes) {
  await ensureStore();
  await fs.writeFile(QUOTES_FILE, JSON.stringify(quotes, null, 2), "utf8");
}

function nextFolio(quotes) {
  const numbers = quotes.map((quote) => {
    const match = quote.folio?.match(/V1-(\d+)/);
    return match ? Number(match[1]) : 0;
  });

  const max = numbers.length ? Math.max(...numbers) : 299;
  return `V1-${max + 1}`;
}

export async function listQuotes() {
  const quotes = await readQuotes();
  return quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function createQuote(input) {
  const quotes = await readQuotes();
  const folio = nextFolio(quotes);
  const quote = {
    id: randomUUID(),
    folio,
    fecha: formatMexicoDateShort(new Date()),
    createdAt: new Date().toISOString(),
    status: "Pendiente",
    ...input,
  };

  quotes.push(quote);
  await writeQuotes(quotes);
  return quote;
}

export async function updateQuoteStatus(id, status) {
  if (status !== "Pendiente" && status !== "Cerrada") {
    return null;
  }

  const quotes = await readQuotes();
  const index = quotes.findIndex((quote) => quote.id === id);
  if (index === -1) {
    return null;
  }

  quotes[index] = { ...quotes[index], status };
  await writeQuotes(quotes);
  return quotes[index];
}

export async function getQuoteById(id) {
  const quotes = await readQuotes();
  return quotes.find((quote) => quote.id === id) ?? null;
}
