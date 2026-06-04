import { formatMexicoDateShort } from "@/lib/dates/mexico";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  COTIZACIONES,
  EMPRESA_IDS,
  ESTATUS,
  PERFILES,
  TABLES,
  cotizacionFromForm,
  normalizeCotizacionEstatus,
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
      ? formatMexicoDateShort(row[COTIZACIONES.CREADO_AT])
      : "—",
    creadoAt: row[COTIZACIONES.CREADO_AT] ?? null,
    cliente: row[COTIZACIONES.NOMBRE_CLIENTE],
    whatsappCliente: row[COTIZACIONES.WHATSAPP_CLIENTE] ?? "",
    volumen: Number(row[COTIZACIONES.VOLUMEN_M3]) || 0,
    total: Number(row[COTIZACIONES.TOTAL]) || 0,
    status: normalizeCotizacionEstatus(row[COTIZACIONES.ESTATUS]),
    vendedorId: row[COTIZACIONES.VENDEDOR_ID] ?? null,
  };
}

export function mapCotizacionForDashboard(row, vendedorNombre = "—") {
  return {
    ...mapCotizacionForSeguimiento(row),
    vendedorNombre,
    empresaId: row[COTIZACIONES.EMPRESA_ID] ?? null,
  };
}

export async function listCotizacionesForAdmin(empresaId = null) {
  const supabase = createSupabaseAdmin();
  let query = supabase.from(TABLES.COTIZACIONES).select("*");

  if (empresaId === EMPRESA_IDS.NARVAEZ || empresaId === EMPRESA_IDS.TEPEXI) {
    query = query.eq(COTIZACIONES.EMPRESA_ID, empresaId);
  } else {
    query = query.in(COTIZACIONES.EMPRESA_ID, [EMPRESA_IDS.NARVAEZ, EMPRESA_IDS.TEPEXI]);
  }

  const { data, error } = await query.order(COTIZACIONES.CREADO_AT, { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const vendedorIds = [...new Set(rows.map((row) => row[COTIZACIONES.VENDEDOR_ID]).filter(Boolean))];

  let perfilesPorId = {};
  if (vendedorIds.length > 0) {
    const { data: perfiles, error: perfilesError } = await supabase
      .from(TABLES.PERFILES)
      .select(`${PERFILES.ID}, ${PERFILES.NOMBRE_VENDEDOR}`)
      .in(PERFILES.ID, vendedorIds);

    if (perfilesError) {
      throw new Error(perfilesError.message);
    }

    perfilesPorId = Object.fromEntries(
      (perfiles ?? []).map((perfil) => [perfil[PERFILES.ID], perfil[PERFILES.NOMBRE_VENDEDOR]])
    );
  }

  return rows.map((row) =>
    mapCotizacionForDashboard(row, perfilesPorId[row[COTIZACIONES.VENDEDOR_ID]] ?? "—")
  );
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

export async function deleteCotizacion(id) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(TABLES.COTIZACIONES).delete().eq(COTIZACIONES.ID, id);

  if (error) {
    throw new Error(error.message);
  }
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
