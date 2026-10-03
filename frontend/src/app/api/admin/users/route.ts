import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { normalizeEmail, validateSignUpFields } from "@/lib/auth-input";
import { createAdminUser, listAdminUsers } from "@/lib/admin-users";
import type { AdminUserPlan } from "@/lib/admin-user-types";

async function requireLegacyAdminSession() {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireLegacyAdminSession();
  if (unauthorized) return unauthorized;

  const payload = await listAdminUsers();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireLegacyAdminSession();
  if (unauthorized) return unauthorized;

  let body: {
    email?: string;
    password?: string;
    displayName?: string;
    plan?: AdminUserPlan;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const displayName = body.displayName?.trim() ?? "";
  const validation = validateSignUpFields(email, password, displayName);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const plan: AdminUserPlan = body.plan === "pro" ? "pro" : "free";

  try {
    const user = await createAdminUser({
      email,
      password,
      displayName: displayName || undefined,
      plan,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create user.";
    const status = message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
