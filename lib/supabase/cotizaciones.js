import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  COTIZACIONES,
  ESTATUS,
  PERFILES,
  TABLES,
  cotizacionFromForm,
} from "@/lib/supabase/schema";

export async function getPerfilByCorreo(correo) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.PERFILES)
    .select(`${PERFILES.ID}, ${PERFILES.EMPRESA_ID}, ${PERFILES.CORREO}, ${PERFILES.NOMBRE_VENDEDOR}`)
    .eq(PERFILES.CORREO, correo.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertCotizacion(payload) {
  const supabase = createSupabaseAdmin();
  const row = cotizacionFromForm(payload);

  const { data, error } = await supabase
    .from(TABLES.COTIZACIONES)
    .insert(row)
    .select(
      `${COTIZACIONES.ID}, ${COTIZACIONES.FOLIO_INSTITUCIONAL}, ${COTIZACIONES.FOLIO_CONSECUTIVO}, ${COTIZACIONES.ESTATUS}, ${COTIZACIONES.TOTAL}, ${COTIZACIONES.CREADO_AT}`
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCotizacionByFolio(folio) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.COTIZACIONES)
    .select("*")
    .eq(COTIZACIONES.FOLIO_INSTITUCIONAL, folio)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function mapCotizacionForSeguimiento(row) {
  return {
    id: row[COTIZACIONES.ID],
    folio: row[COTIZACIONES.FOLIO_INSTITUCIONAL],
    fecha: row[COTIZACIONES.CREADO_AT]
      ? new Date(row[COTIZACIONES.CREADO_AT]).toLocaleDateString("es-MX")
      : "—",
    creadoAt: row[COTIZACIONES.CREADO_AT] ?? null,
    cliente: row[COTIZACIONES.NOMBRE_CLIENTE],
    volumen: Number(row[COTIZACIONES.VOLUMEN_M3]) || 0,
    total: Number(row[COTIZACIONES.TOTAL]) || 0,
    status: row[COTIZACIONES.ESTATUS] || ESTATUS.PENDIENTE,
  };
}

export async function listCotizacionesByVendedor(vendedorId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.COTIZACIONES)
    .select("*")
    .eq(COTIZACIONES.VENDEDOR_ID, vendedorId)
    .order(COTIZACIONES.CREADO_AT, { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCotizacionForSeguimiento);
}

export async function getCotizacionById(id) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.COTIZACIONES)
    .select("*")
    .eq(COTIZACIONES.ID, id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateCotizacionEstatus(id, estatus) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.COTIZACIONES)
    .update({ [COTIZACIONES.ESTATUS]: estatus })
    .eq(COTIZACIONES.ID, id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
