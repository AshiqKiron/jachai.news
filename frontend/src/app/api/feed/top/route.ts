import { NextResponse } from "next/server";

import { etagForStories, ifNoneMatchMatches } from "@/lib/feed-etag";
import { HOME_TOP_STORIES_LIMIT } from "@/lib/subscription-features";
import { getTopStories } from "@/lib/stories";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? HOME_TOP_STORIES_LIMIT);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : HOME_TOP_STORIES_LIMIT;

  const feed = await getTopStories(limit);
  const etag = etagForStories(feed.stories);

  if (ifNoneMatchMatches(request.headers.get("if-none-match"), etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  }

  return NextResponse.json(feed, {
    headers: {
      ETag: etag,
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
