import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { triggerAdminIngest } from "@/lib/admin-api";

export async function POST() {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await triggerAdminIngest();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
