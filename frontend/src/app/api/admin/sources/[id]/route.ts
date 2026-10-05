import { NextResponse } from "next/server";

import { removeAdminSource } from "@/lib/admin-api";
import { requireAdminRouteAuthorized } from "@/lib/admin-route-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const sourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(sourceId) || sourceId < 1) {
    return NextResponse.json({ error: "Invalid source id." }, { status: 400 });
  }

  try {
    const result = await removeAdminSource(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove source.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
