import { NextResponse } from "next/server";

import { fetchAdminOverview, fetchApiHealth } from "@/lib/admin-api";
import { isAdminRouteAuthorized } from "@/lib/admin-route-auth";

export async function GET() {
  if (!(await isAdminRouteAuthorized())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [overview, apiHealthy] = await Promise.all([fetchAdminOverview(), fetchApiHealth()]);

  return NextResponse.json(
    { overview, apiHealthy },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    },
  );
}
