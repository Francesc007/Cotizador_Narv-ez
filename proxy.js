import { NextResponse } from "next/server";

function resolveTenantId(request) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (!hostname || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return process.env.DEFAULT_TENANT_ID ?? "default";
  }

  const [subdomain] = hostname.split(".");

  if (!subdomain || subdomain === "www") {
    return process.env.DEFAULT_TENANT_ID ?? "default";
  }

  return subdomain.toLowerCase();
}

function withTenantContext(request) {
  const tenantId = resolveTenantId(request);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-tenant-id", tenantId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function applySecurityHeaders(response, request) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  if (request.nextUrl.pathname.startsWith("/api/auth/login") && request.method === "POST") {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export function proxy(request) {
  const response = withTenantContext(request);
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
