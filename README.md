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
middleware.js   # cabeceras de seguridad
public/         # assets estaticos
scripts/        # utilidades
```

## Despliegue

1. Configura `AUTH_SECRET` y `AUTH_USERS` en tu plataforma (Vercel, etc.)
2. Ejecuta `npm run build`
3. Despliega con `npm run start` o el adaptador de tu hosting

## Repositorio

https://github.com/Francesc007/Cotizador_Narv-ez
