import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminAccess, verifyAdminSession } from "@/lib/admin-auth";
import {
  adminSubdomainPublicUrl,
  adminSurfacePath,
  effectiveAdminInternalPath,
  hostnameWithoutPort,
  isAdminPublicInternalPath,
  isAdminSubdomainHost,
  isMainSiteAppPath,
  mainSiteOriginFromRequest,
  resolvesToAdminInternalPath,
} from "@/lib/admin-host";
import { securityHeaders } from "@/lib/security-headers";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

const SUPABASE_SESSION_PATH_PREFIXES = [
  "/browse",
  "/sign-in",
  "/sign-up",
  "/auth",
  "/api/auth",
];

function requestHost(request: NextRequest): string {
  return hostnameWithoutPort(request.headers.get("host") ?? "");
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
}

function needsSupabaseSessionRefresh(pathname: string, request: NextRequest): boolean {
  if (SUPABASE_SESSION_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return hasSupabaseAuthCookie(request);
}

async function enforceAdminAccess(
  request: NextRequest,
  response: NextResponse,
  internalPath: string,
  host: string,
): Promise<NextResponse> {
  const legacyAdmin = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  let user: { email?: string | null; app_metadata?: Record<string, unknown> } | null = null;

  if (!legacyAdmin && !isAdminPublicInternalPath(internalPath)) {
    const refreshed = await updateSupabaseSession(request, response);
    response = refreshed.response;
    user = refreshed.user;
  }

  if (isAdminPublicInternalPath(internalPath)) {
    return withSecurityHeaders(response);
  }

  if (await hasAdminAccess(request.cookies.get(ADMIN_COOKIE_NAME)?.value, user)) {
    return withSecurityHeaders(response);
  }

  const login = new URL(adminSurfacePath("login", host), request.url);
  login.searchParams.set("next", adminSurfacePath("", host));
  return withSecurityHeaders(NextResponse.redirect(login));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = requestHost(request);
  const onAdminHost = isAdminSubdomainHost(host);

  if (pathname.startsWith("/api/admin")) {
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  const redirectUrl = !onAdminHost ? adminSubdomainPublicUrl(pathname) : null;
  if (redirectUrl) {
    const target = new URL(redirectUrl);
    target.search = request.nextUrl.search;
    return withSecurityHeaders(NextResponse.redirect(target, 308));
  }

  if (onAdminHost && !pathname.startsWith("/api") && isMainSiteAppPath(pathname)) {
    const mainOrigin = mainSiteOriginFromRequest(host, request.nextUrl.origin);
    const target = new URL(pathname, mainOrigin);
    target.search = request.nextUrl.search;
    return withSecurityHeaders(NextResponse.redirect(target, 308));
  }

  let response = NextResponse.next({ request });

  if (onAdminHost && !pathname.startsWith("/api")) {
    const internalPath = effectiveAdminInternalPath(pathname, host);
    if (internalPath !== pathname) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = internalPath;
      response = NextResponse.rewrite(rewriteUrl);
    }
    return enforceAdminAccess(request, response, internalPath, host);
  }

  if (resolvesToAdminInternalPath(pathname, host)) {
    const internalPath = effectiveAdminInternalPath(pathname, host);
    return enforceAdminAccess(request, response, internalPath, host);
  }

  if (needsSupabaseSessionRefresh(pathname, request)) {
    const refreshed = await updateSupabaseSession(request, response);
    response = refreshed.response;
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/admin",
    "/admin/:path*",
    "/browse",
    "/sign-in",
    "/sign-up",
    "/auth/:path*",
    "/api/auth/:path*",
    "/api/admin/:path*",
  ],
};
