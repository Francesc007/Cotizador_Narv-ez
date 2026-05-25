import { cookies } from "next/headers";
import { SESSION_COOKIE, getSessionCookieOptions, getSessionUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ user: null }, 401);
  }
  return jsonResponse({ user });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return jsonResponse({ ok: true });
}
