import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  isAdminPasswordConfigured,
  isSupabaseAdminUser,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { securityHeaders } from "@/lib/security-headers";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

const ADMIN_PUBLIC_PATHS = new Set(["/admin/login", "/admin/register"]);

async function isAdminAuthorized(
  request: NextRequest,
  user: { email?: string | null; app_metadata?: Record<string, unknown> } | null,
): Promise<boolean> {
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await verifyAdminSession(session)) return true;

  if (isSupabaseAdminUser(user)) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });
  const { response: refreshed, user } = await updateSupabaseSession(request, response);
  response = refreshed;

  if (!pathname.startsWith("/admin")) {
    return withSecurityHeaders(response);
  }

  if (ADMIN_PUBLIC_PATHS.has(pathname)) {
    return withSecurityHeaders(response);
  }

  if (await isAdminAuthorized(request, user)) {
    return withSecurityHeaders(response);
  }

  if (!isAdminPasswordConfigured() && process.env.NODE_ENV === "development") {
    return withSecurityHeaders(response);
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return withSecurityHeaders(NextResponse.redirect(login));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
