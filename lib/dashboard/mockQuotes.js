import { EMPRESA_IDS, ESTATUS } from "@/lib/supabase/schema";

/** Vendedores simulados para demo de panel de gerencia (escala 15–20 usuarios). */
const MOCK_VENDEDORES = [
  { nombre: "Carlos Mendoza", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Ana Ruiz", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Luis Herrera", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Patricia Solis", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Roberto Nunez", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Diana Flores", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Miguel Torres", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Sofia Ramirez", empresaId: EMPRESA_IDS.NARVAEZ },
  { nombre: "Jorge Tepexi", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Elena Vargas", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Fernando Castro", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Gabriela Ortiz", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Hector Limon", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Isabel Morales", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Julio Paredes", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Karla Ibanez", empresaId: EMPRESA_IDS.TEPEXI },
  { nombre: "Oscar Delgado", empresaId: EMPRESA_IDS.TEPEXI },
];

const CLIENTES = [
  "Obra Alfa",
  "Consorcio Norte",
  "Residencial Delta",
  "Grupo Horizonte",
  "Constructora Atlas",
  "Desarrollo Poniente",
  "Plaza Central",
  "Vialidad Sur",
];

function hoursAgoIso(hours) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString("es-MX");
}

function buildMockQuotes() {
  const quotes = [];
  let folioSeq = 301;

  MOCK_VENDEDORES.forEach((vendedor, vendorIndex) => {
    const prefix = vendedor.empresaId === EMPRESA_IDS.TEPEXI ? "T" : "N";
    const quoteCount = 2 + (vendorIndex % 3);

    for (let index = 0; index < quoteCount; index += 1) {
      const hourOffset = (vendorIndex * 2 + index) % 23;
      const creadoAt = hoursAgoIso(hourOffset);
      const volumen = 8 + ((vendorIndex + index) % 5) * 4;
      const unit = 1750 + (vendorIndex % 4) * 120;
      const total = Math.round(volumen * unit * 1.16);
      const status =
        index === 0 && vendorIndex % 4 !== 0 ? ESTATUS.CERRADA : ESTATUS.PENDIENTE;

      quotes.push({
        id: `mock-${vendedor.empresaId}-${vendorIndex}-${index}`,
        folio: `${prefix}-${folioSeq}`,
        fecha: formatFecha(creadoAt),
        creadoAt,
        cliente: CLIENTES[(vendorIndex + index) % CLIENTES.length],
        whatsappCliente: `222${String(1000000 + vendorIndex * 11 + index).slice(-7)}`,
        volumen,
        total,
        status,
        vendedorNombre: vendedor.nombre,
        empresaId: vendedor.empresaId,
      });

      folioSeq += 1;
    }
  });

  return quotes.sort((a, b) => new Date(b.creadoAt) - new Date(a.creadoAt));
}

export const DASHBOARD_MOCK_QUOTES = buildMockQuotes();
