-- =============================================================================
-- Cotizador Multi-Tenant — Esquema core (Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Orden: 001 (este archivo) → luego RLS en migración futura
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabla 1: empresas
-- Separa plantas (Tepexi / Narváez). id = clave usada en app y en perfiles.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,              -- 'tepexi' | 'narvaez'
    nombre TEXT NOT NULL,             -- Nombre comercial visible
    prefijo_folio TEXT NOT NULL       -- 'T' | 'N' → folio_institucional (T-301)
);

INSERT INTO empresas (id, nombre, prefijo_folio) VALUES
    ('tepexi', 'Concretos Tepexi', 'T'),
    ('narvaez', 'Concretos Narváez', 'N')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tabla 2: perfiles_usuarios
-- Perfil extendido ligado a auth.users de Supabase.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    correo TEXT NOT NULL UNIQUE,
    nombre_vendedor TEXT NOT NULL,
    empresa_id TEXT REFERENCES empresas(id),  -- NULL = dirección / SuperAdmin (todas)
    rol TEXT NOT NULL DEFAULT 'vendedor'      -- 'vendedor' | 'admin'
);

CREATE INDEX IF NOT EXISTS idx_perfiles_empresa ON perfiles_usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_correo ON perfiles_usuarios(correo);

-- ---------------------------------------------------------------------------
-- Tabla 3: cotizaciones
-- Motor de guardado. folio_consecutivo es por planta (no global).
-- folio_institucional se genera en INSERT vía trigger (ej. T-301, N-105).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id TEXT NOT NULL REFERENCES empresas(id),
    vendedor_id UUID NOT NULL REFERENCES perfiles_usuarios(id),
    folio_consecutivo INTEGER,                -- Auto por empresa (trigger)
    folio_institucional TEXT,                 -- Visible: T-301, N-105 (trigger)
    nombre_cliente TEXT NOT NULL,
    solicitante TEXT,
    codigo_postal TEXT NOT NULL,
    volumen_m3 NUMERIC NOT NULL,
    resistencia TEXT NOT NULL,
    edad TEXT NOT NULL,
    revenimiento TEXT NOT NULL,
    aditivo TEXT,
    bomba_estacionaria BOOLEAN DEFAULT false,
    bomba_pluma BOOLEAN DEFAULT false,
    servicio_domingo BOOLEAN DEFAULT false,
    horario_nocturno BOOLEAN DEFAULT false,
    subtotal NUMERIC NOT NULL,
    descuento_porcentaje NUMERIC DEFAULT 0,
    iva NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    estatus TEXT NOT NULL DEFAULT 'Pendiente',  -- 'Pendiente' | 'Enviada' | 'Cerrada'
    creado_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

    CONSTRAINT cotizaciones_estatus_check
        CHECK (estatus IN ('Pendiente', 'Enviada', 'Cerrada')),
    CONSTRAINT cotizaciones_empresa_folio_consecutivo_unique
        UNIQUE (empresa_id, folio_consecutivo),
    CONSTRAINT cotizaciones_empresa_folio_institucional_unique
        UNIQUE (empresa_id, folio_institucional)
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_vendedor ON cotizaciones(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estatus ON cotizaciones(estatus);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_creado ON cotizaciones(creado_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: folio automático por planta (evita duplicados T-xxx / N-xxx)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION asignar_folio_institucional()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    prefijo TEXT;
    siguiente INTEGER;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('folio_' || NEW.empresa_id));

    SELECT e.prefijo_folio INTO prefijo
    FROM empresas e
    WHERE e.id = NEW.empresa_id;

    IF prefijo IS NULL THEN
        RAISE EXCEPTION 'empresa_id invalido: %', NEW.empresa_id;
    END IF;

    SELECT COALESCE(MAX(c.folio_consecutivo), 0) + 1 INTO siguiente
    FROM cotizaciones c
    WHERE c.empresa_id = NEW.empresa_id
    FOR UPDATE;

    NEW.folio_consecutivo := siguiente;
    NEW.folio_institucional := prefijo || '-' || siguiente::TEXT;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asignar_folio ON cotizaciones;

CREATE TRIGGER trg_asignar_folio
    BEFORE INSERT ON cotizaciones
    FOR EACH ROW
    EXECUTE FUNCTION asignar_folio_institucional();
