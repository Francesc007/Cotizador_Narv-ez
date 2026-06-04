import { NextResponse } from "next/server";
import { userWithPerfilId } from "@/lib/auth/perfil";
import { SESSION_COOKIE, getSessionCookieOptions, getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: await userWithPerfilId(user) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
