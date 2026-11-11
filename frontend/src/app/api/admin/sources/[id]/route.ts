import { NextResponse } from "next/server";

import { removeAdminSource, updateAdminSource } from "@/lib/admin-api";
import { requireAdminRouteAuthorized } from "@/lib/admin-route-auth";

type RouteContext = { params: Promise<{ id: string }> };

function parseSourceId(id: string): number | null {
  const sourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(sourceId) || sourceId < 1) return null;
  return sourceId;
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const sourceId = parseSourceId(id);
  if (sourceId === null) {
    return NextResponse.json({ error: "Invalid source id." }, { status: 400 });
  }

  let body: {
    feed_url?: string;
    bias_score?: number | null;
    ingest_mode?: "rss" | "file";
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const feed_url = typeof body.feed_url === "string" ? body.feed_url.trim() : undefined;
  if (feed_url === "") {
    return NextResponse.json({ error: "Feed URL cannot be empty when provided." }, { status: 400 });
  }

  try {
    const result = await updateAdminSource(sourceId, {
      feed_url,
      ingest_mode: body.ingest_mode === "file" || body.ingest_mode === "rss" ? body.ingest_mode : undefined,
      bias_score: typeof body.bias_score === "number" ? body.bias_score : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update source.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const sourceId = parseSourceId(id);
  if (sourceId === null) {
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
