import { NextResponse } from "next/server";

import { createAdminSource } from "@/lib/admin-api";
import { requireAdminRouteAuthorized } from "@/lib/admin-route-auth";

export async function POST(request: Request) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  let body: { name?: string; feed_url?: string; bias_score?: number | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const feed_url = typeof body.feed_url === "string" ? body.feed_url.trim() : "";
  if (!name || !feed_url) {
    return NextResponse.json({ error: "Name and feed URL are required." }, { status: 400 });
  }

  try {
    const result = await createAdminSource({
      name,
      feed_url,
      bias_score: typeof body.bias_score === "number" ? body.bias_score : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add source.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
