import { NextResponse } from "next/server";

import { getCustomSourceFeeds } from "@/lib/stories";

export async function GET() {
  const feed = await getCustomSourceFeeds();

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
