import { cookies } from "next/headers";
import { isRateLimited, resetRateLimit } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/auth/users";
import { getClientIp, jsonResponse } from "@/lib/http";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`login:${ip}`)) {
      return jsonResponse({ error: "Demasiados intentos. Intenta de nuevo en unos minutos." }, 429);
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return jsonResponse({ error: "Email y contrasena son obligatorios." }, 400);
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return jsonResponse({ error: "Credenciales invalidas." }, 401);
    }

    resetRateLimit(`login:${ip}`);

    const token = createSessionToken(user);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

    return jsonResponse({ user });
  } catch (error) {
    console.error("Login error:", error);
    return jsonResponse({ error: "No fue posible iniciar sesion." }, 500);
  }
}
