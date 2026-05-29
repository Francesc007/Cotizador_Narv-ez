/**
 * Nombres canónicos de tablas y columnas Supabase.
 * Usar estas constantes al escribir queries / inserts para evitar typos.
 *
 * @see supabase/schema-reference.md
 * @see supabase/migrations/001_core_schema.sql
 */

export const TABLES = {
  EMPRESAS: "empresas",
  PERFILES: "perfiles_usuarios",
  COTIZACIONES: "cotizaciones",
};

export const EMPRESAS = {
  ID: "id",
  NOMBRE: "nombre",
  PREFIJO_FOLIO: "prefijo_folio",
};

export const EMPRESA_IDS = {
  TEPEXI: "tepexi",
  NARVAEZ: "narvaez",
};

export const PERFILES = {
  ID: "id",
  CORREO: "correo",
  NOMBRE_VENDEDOR: "nombre_vendedor",
  EMPRESA_ID: "empresa_id",
  ROL: "rol",
};

export const ROLES = {
  VENDEDOR: "vendedor",
  ADMIN: "admin",
};

export const COTIZACIONES = {
  ID: "id",
  EMPRESA_ID: "empresa_id",
  VENDEDOR_ID: "vendedor_id",
  FOLIO_CONSECUTIVO: "folio_consecutivo",
  FOLIO_INSTITUCIONAL: "folio_institucional",
  NOMBRE_CLIENTE: "nombre_cliente",
  SOLICITANTE: "solicitante",
  WHATSAPP_CLIENTE: "whatsapp_cliente",
  CODIGO_POSTAL: "codigo_postal",
  VOLUMEN_M3: "volumen_m3",
  RESISTENCIA: "resistencia",
  EDAD: "edad",
  REVENIMIENTO: "revenimiento",
  ADITIVO: "aditivo",
  BOMBA_ESTACIONARIA: "bomba_estacionaria",
  BOMBA_PLUMA: "bomba_pluma",
  SERVICIO_DOMINGO: "servicio_domingo",
  HORARIO_NOCTURNO: "horario_nocturno",
  SUBTOTAL: "subtotal",
  DESCUENTO_PORCENTAJE: "descuento_porcentaje",
  IVA: "iva",
  TOTAL: "total",
  ESTATUS: "estatus",
  CREADO_AT: "creado_at",
};

export const ESTATUS = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CERRADA: "Cerrada",
};

/** Mapeo estado React (app/page.js) → fila cotizaciones */
export function cotizacionFromForm({
  empresaId,
  vendedorId,
  cliente,
  solicitante,
  whatsappCliente,
  cp,
  volumen,
  resistencia,
  edad,
  revenimiento,
  aditivo,
  bombaEstacionaria,
  bombaPluma,
  domingo,
  nocturno,
  discountPercent,
  priceModel,
}) {
  return {
    [COTIZACIONES.EMPRESA_ID]: empresaId,
    [COTIZACIONES.VENDEDOR_ID]: vendedorId,
    [COTIZACIONES.NOMBRE_CLIENTE]: cliente,
    [COTIZACIONES.SOLICITANTE]: solicitante ?? null,
    [COTIZACIONES.WHATSAPP_CLIENTE]: whatsappCliente ?? null,
    [COTIZACIONES.CODIGO_POSTAL]: cp,
    [COTIZACIONES.VOLUMEN_M3]: volumen,
    [COTIZACIONES.RESISTENCIA]: resistencia,
    [COTIZACIONES.EDAD]: edad,
    [COTIZACIONES.REVENIMIENTO]: revenimiento,
    [COTIZACIONES.ADITIVO]: aditivo ?? null,
    [COTIZACIONES.BOMBA_ESTACIONARIA]: bombaEstacionaria,
    [COTIZACIONES.BOMBA_PLUMA]: bombaPluma,
    [COTIZACIONES.SERVICIO_DOMINGO]: domingo,
    [COTIZACIONES.HORARIO_NOCTURNO]: nocturno,
    [COTIZACIONES.SUBTOTAL]: priceModel.subtotal,
    [COTIZACIONES.DESCUENTO_PORCENTAJE]: discountPercent,
    [COTIZACIONES.IVA]: priceModel.iva,
    [COTIZACIONES.TOTAL]: priceModel.total,
    [COTIZACIONES.ESTATUS]: ESTATUS.PENDIENTE,
  };
}
