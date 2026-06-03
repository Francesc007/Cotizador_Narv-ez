# Referencia de esquema Supabase — Cotizador Multi-Tenant

Documento de referencia para cambios futuros. **Nombres canónicos** de tablas y columnas.

---

## Tabla `empresas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | TEXT PK | `'tepexi'` \| `'narvaez'` — mismo id que `lib/tenants/themes.js` |
| `nombre` | TEXT | Nombre comercial |
| `prefijo_folio` | TEXT | `'T'` (Tepexi) \| `'N'` (Narváez) |

**Datos semilla**

| id | nombre | prefijo_folio |
|----|--------|---------------|
| tepexi | Concretos Tepexi | T |
| narvaez | Concretos Narváez | N |

**App:** `getTenant(empresa)` → tema, logo, colores.

---

## Tabla `perfiles_usuarios`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | = `auth.users.id` (Supabase Auth) |
| `correo` | TEXT | Email de login |
| `nombre_vendedor` | TEXT | Nombre en navbar / cotizaciones |
| `empresa_id` | TEXT FK → empresas | Planta del vendedor; `NULL` = SuperAdmin |
| `rol` | TEXT | `'vendedor'` \| `'admin'` |

**App actual (transitorio):** `AUTH_USERS` → campos `email`, `name`, `empresa`, `role`.

| AUTH_USERS | perfiles_usuarios |
|------------|-------------------|
| email | correo |
| name | nombre_vendedor |
| empresa | empresa_id (`all` → NULL en Supabase) |
| role | rol |

---

## Tabla `cotizaciones`

| Columna | Tipo | UI / Estado React (`app/page.js`) |
|---------|------|-----------------------------------|
| `id` | UUID | — (interno) |
| `empresa_id` | TEXT FK | `sessionUser.empresa` |
| `vendedor_id` | UUID FK | `sessionUser.id` (Supabase) |
| `folio_consecutivo` | INTEGER | Auto por planta (trigger) |
| `folio_institucional` | TEXT | Header "Folio" — ej. `T-301`, `N-105` |
| `nombre_cliente` | TEXT | `cliente` |
| `solicitante` | TEXT | `solicitante` |
| `codigo_postal` | TEXT | `cp` |
| `volumen_m3` | NUMERIC | `volumen` |
| `resistencia` | TEXT | `resistencia` |
| `edad` | TEXT | `edad` |
| `revenimiento` | TEXT | `revenimiento` |
| `aditivo` | TEXT | `aditivo` |
| `bomba_estacionaria` | BOOLEAN | `bombaEstacionaria` |
| `bomba_pluma` | BOOLEAN | `bombaPluma` |
| `servicio_domingo` | BOOLEAN | `domingo` |
| `horario_nocturno` | BOOLEAN | `nocturno` |
| `subtotal` | NUMERIC | `priceModel.subtotal` |
| `descuento_porcentaje` | NUMERIC | `discountPercent` |
| `iva` | NUMERIC | `priceModel.iva` |
| `total` | NUMERIC | `priceModel.total` |
| `estatus` | TEXT | Seguimiento / Dashboard: `'Pendiente'` \| `'Cerrada'` |
| `creado_at` | TIMESTAMPTZ | Fecha en tablas |

**Folio:** no enviar `folio_consecutivo` ni `folio_institucional` en INSERT; el trigger `trg_asignar_folio` los genera por `empresa_id` + `empresas.prefijo_folio`.

**Restricciones:** único `(empresa_id, folio_consecutivo)` y `(empresa_id, folio_institucional)`.

---

## Archivos del proyecto relacionados

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/001_core_schema.sql` | SQL ejecutable |
| `lib/supabase/schema.js` | Constantes de tablas/columnas para código |
| `lib/tenants/themes.js` | Temas UI por `empresa_id` |
| `lib/quotes/store.js` | Persistencia local temporal (reemplazar por Supabase) |
| `app/api/quotes/route.js` | API guardado (migrar a Supabase) |

---

## Próximos pasos sugeridos

1. RLS: vendedor solo ve/edita cotizaciones de su `empresa_id`; admin ve todas.
2. Sustituir `lib/quotes/store.js` por inserts a `cotizaciones`.
3. Login: Supabase Auth + lectura de `perfiles_usuarios` para `empresa_id` y tema.
