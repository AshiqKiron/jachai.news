import { NextResponse } from "next/server";

import { renderStoryShareCard } from "@/lib/story-share-card-image";
import { buildStoryShareCard } from "@/lib/story-share-card";
import { hasProAccess } from "@/lib/subscription-access";
import { resolveStoryBySlugDirect } from "@/lib/stories";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

/** Session-aware square card. Pro responses include names or quoted lines. */
export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const resolved = await resolveStoryBySlugDirect(slug);
  if (!resolved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const includeProDetail = await hasProAccess();
  const card = buildStoryShareCard(resolved.story, includeProDetail);
  const image = await renderStoryShareCard(card);
  image.headers.set("Cache-Control", "private, no-store");
  image.headers.set("Vary", "Cookie");
  return image;
}
