import { cookies } from "next/headers";
import { SESSION_COOKIE, getSessionCookieOptions } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/http";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return jsonResponse({ ok: true });
}
