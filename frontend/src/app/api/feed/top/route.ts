import { NextResponse } from "next/server";

import { FREE_DAILY_TOP_STORIES_LIMIT } from "@/lib/subscription-features";
import { getTopStories } from "@/lib/stories";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? FREE_DAILY_TOP_STORIES_LIMIT);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : FREE_DAILY_TOP_STORIES_LIMIT;

  const feed = await getTopStories(limit);

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
