import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  adminSessionToken,
  isAdminPasswordConfigured,
  legacyAdminUsername,
  verifyLegacyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Admin credentials are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { username?: string; password?: string };
  const username = (body.username ?? legacyAdminUsername()).trim();
  const password = body.password ?? "";
  if (!verifyLegacyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, await adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
