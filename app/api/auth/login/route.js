import { NextResponse } from "next/server";
import { authConfigErrorForClient, getAuthEnvProblem } from "@/lib/auth/env";
import { isRateLimited, resetRateLimit } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { userWithPerfilId } from "@/lib/auth/perfil";
import { authenticateUser } from "@/lib/auth/users";
import { getClientIp } from "@/lib/http";

export async function POST(request) {
  try {
    const configError = authConfigErrorForClient();
    if (configError) {
      const detail = getAuthEnvProblem();
      if (detail) {
        console.error("[auth/login] Configuracion incompleta:", detail);
      }
      return NextResponse.json({ error: configError }, { status: 503 });
    }

    const ip = getClientIp(request);
    if (isRateLimited(`login:${ip}`)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contrasena son obligatorios." }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
    }

    resetRateLimit(`login:${ip}`);

    const token = createSessionToken(user);
    const response = NextResponse.json({ user: await userWithPerfilId(user) });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "No fue posible iniciar sesion." }, { status: 500 });
  }
}
