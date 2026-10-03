import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { deleteAdminUser, setAdminUserPlan, updateAdminUserProfile } from "@/lib/admin-users";
import type { AdminUserPlan } from "@/lib/admin-user-types";
import { validateDisplayName } from "@/lib/auth-input";

type RouteContext = { params: Promise<{ id: string }> };

async function requireLegacyAdminSession() {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireLegacyAdminSession();
  if (unauthorized) return unauthorized;

  const { id: userId } = await context.params;
  if (!userId?.length) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  let body: { plan?: AdminUserPlan; displayName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.displayName !== undefined) {
    const nameCheck = validateDisplayName(body.displayName);
    if (!nameCheck.ok) {
      return NextResponse.json({ error: nameCheck.message }, { status: 400 });
    }
  }

  if (body.plan !== undefined && body.plan !== "free" && body.plan !== "pro") {
    return NextResponse.json({ error: "Plan must be free or pro." }, { status: 400 });
  }

  try {
    if (body.displayName !== undefined) {
      await updateAdminUserProfile(userId, { displayName: body.displayName });
    }
    if (body.plan !== undefined) {
      await setAdminUserPlan(userId, body.plan);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update user.";
    const status = message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireLegacyAdminSession();
  if (unauthorized) return unauthorized;

  const { id: userId } = await context.params;
  if (!userId?.length) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  try {
    await deleteAdminUser(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete user.";
    const status = message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
