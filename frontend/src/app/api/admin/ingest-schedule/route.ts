import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { fetchAdminIngestSchedule, updateAdminIngestSchedule } from "@/lib/admin-api";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const schedule = await fetchAdminIngestSchedule();
    if (!schedule) {
      return NextResponse.json({ error: "Could not load ingest schedule." }, { status: 502 });
    }
    return NextResponse.json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load ingest schedule.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { interval_minutes?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const intervalMinutes = body.interval_minutes;
  if (typeof intervalMinutes !== "number" || !Number.isFinite(intervalMinutes)) {
    return NextResponse.json({ error: "interval_minutes is required." }, { status: 400 });
  }

  try {
    const schedule = await updateAdminIngestSchedule(Math.round(intervalMinutes));
    return NextResponse.json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update ingest schedule.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
