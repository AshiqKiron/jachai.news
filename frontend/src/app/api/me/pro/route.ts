import { NextResponse } from "next/server";

import { getProAccessState } from "@/lib/subscription-access";

export async function GET() {
  const state = await getProAccessState();
  return NextResponse.json({
    isPro: state.isPro,
    userId: state.userId,
  });
}
