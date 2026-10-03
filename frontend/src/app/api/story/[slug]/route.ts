import { NextResponse } from "next/server";

import { etagForStory, ifNoneMatchMatches } from "@/lib/feed-etag";
import { resolveStoryBySlug } from "@/lib/stories";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const resolved = await resolveStoryBySlug(slug);

  if (!resolved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const etag = etagForStory(resolved.story);
  if (ifNoneMatchMatches(request.headers.get("if-none-match"), etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  return NextResponse.json(resolved, {
    headers: {
      ETag: etag,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
