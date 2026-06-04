import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cn_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres.");
  }
  return secret;
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(user) {
  const secret = getAuthSecret();
  const payload = {
    email: user.email,
    role: user.role,
    name: user.name,
    empresa: user.empresa,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const secret = getAuthSecret();
    const [encoded, signature] = token.split(".");
    const expected = sign(encoded, secret);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      role: payload.role,
      name: payload.name,
      empresa: payload.empresa || (payload.role === "admin" ? "all" : "narvaez"),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

function isSecureCookieContext() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return true;
  }
  return false;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
