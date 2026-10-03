import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { removeAdminSource } from "@/lib/admin-api";
import { CUSTOM_SOURCE_FEEDS_CACHE_TAG } from "@/lib/stories";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const sourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(sourceId) || sourceId < 1) {
    return NextResponse.json({ error: "Invalid source id." }, { status: 400 });
  }

  try {
    const result = await removeAdminSource(sourceId);
    revalidateTag(CUSTOM_SOURCE_FEEDS_CACHE_TAG);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove source.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
