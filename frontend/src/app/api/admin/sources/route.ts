import { NextResponse } from "next/server";

import { createAdminSource } from "@/lib/admin-api";
import { requireAdminRouteAuthorized } from "@/lib/admin-route-auth";

export async function POST(request: Request) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  let body: {
    name?: string;
    feed_url?: string;
    bias_score?: number | null;
    ingest_mode?: "rss" | "file";
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const ingest_mode = body.ingest_mode === "file" ? "file" : "rss";
  const feed_url = typeof body.feed_url === "string" ? body.feed_url.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Outlet name is required." }, { status: 400 });
  }
  if (ingest_mode === "rss" && !feed_url) {
    return NextResponse.json({ error: "Feed URL is required for live RSS." }, { status: 400 });
  }

  try {
    const result = await createAdminSource({
      name,
      feed_url: feed_url || undefined,
      ingest_mode,
      bias_score: typeof body.bias_score === "number" ? body.bias_score : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add source.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
