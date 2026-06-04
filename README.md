# Cotizador Concretos Narvaez

Plataforma web de cotizaciones de concreto premezclado para el equipo comercial de Concretos Narvaez.

## Caracteristicas

- Login seguro con sesion firmada en cookie HttpOnly
- Panel del vendedor con cotizador paso a paso
- Dashboard de gerencia (rol admin)
- Proteccion contra fuerza bruta en login
- Cabeceras de seguridad HTTP

## Requisitos

- Node.js 20+
- npm 10+

## Instalacion

```bash
git clone https://github.com/Francesc007/Cotizador_Narv-ez.git
cd Cotizador_Narv-ez
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

| Variable | Descripcion |
| --- | --- |
| `AUTH_SECRET` | Secreto para firmar sesiones (minimo 32 caracteres) |
| `AUTH_USERS` | JSON con usuarios, hash de contrasena y rol |

### Usuarios demo

| Email | Contrasena | Rol |
| --- | --- | --- |
| `vendedor@concretos.com` | `Vendedor2026!` | vendedor |
| `admin@concretos.com` | `Admin2026!` | admin |

### Generar hash de contrasena

```bash
node scripts/hash-password.js "TuContrasenaSegura"
```

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build de produccion
npm run start    # Servidor de produccion
npm run lint     # ESLint
```

## Seguridad

- Las contrasenas nunca se guardan en texto plano; solo hashes `scrypt`
- Sesiones firmadas con HMAC-SHA256
- Cookies `HttpOnly`, `SameSite=Lax` y `Secure` en produccion
- Rate limit basico en `/api/auth/login`
- `.env.local` y secretos **no** deben subirse a GitHub

## Estructura

```
app/
  api/auth/     # login, logout, session
  page.js       # UI principal
lib/auth/       # sesion, usuarios, passwords
proxy.js          # cabeceras de seguridad y contexto tenant
public/         # assets estaticos
scripts/        # utilidades
```

## Despliegue (Vercel)

El **login no usa Supabase Auth**. La sesión es la cookie `cn_session`, firmada con variables propias de la app. Configurar solo `NEXT_PUBLIC_SUPABASE_*` y el Site URL en Supabase **no habilita el inicio de sesión**.

En Vercel → **Settings → Environment Variables** (Production y Preview):

| Variable | Obligatoria para login | Notas |
| --- | --- | --- |
| `AUTH_SECRET` | Sí | Minimo 32 caracteres; debe ser el mismo valor en todos los entornos donde quieras sesiones validas |
| `AUTH_USERS` | Sí | JSON en **una sola linea** (copia desde `.env.example`) |
| `NEXT_PUBLIC_SUPABASE_URL` | No (solo datos) | Cotizaciones / perfiles en base de datos |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (solo datos) | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Recomendada | Escritura segura en servidor |

El Site URL de Supabase (`https://tu-app.vercel.app`) aplica cuando integres **Supabase Auth** (OAuth, magic link). La app actual no redirige a `localhost:3000` ni a URLs de callback de Supabase.

Tras el deploy, si el login falla revisa los logs de `/api/auth/login` en Vercel: un `503` indica `AUTH_SECRET` o `AUTH_USERS` faltantes o mal formados.

1. Configura `AUTH_SECRET` y `AUTH_USERS`
2. Opcional: variables Supabase para persistir cotizaciones
3. Redeploy

## Repositorio

https://github.com/Francesc007/Cotizador_Narv-ez
