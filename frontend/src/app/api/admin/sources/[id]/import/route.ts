import { NextResponse } from "next/server";

import { importAdminSourceFile } from "@/lib/admin-api";
import { requireAdminRouteAuthorized } from "@/lib/admin-route-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminRouteAuthorized();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const sourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(sourceId) || sourceId < 1) {
    return NextResponse.json({ error: "Invalid source id." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a feed file to upload." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importAdminSourceFile(sourceId, buffer, file.name || "upload.json");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import feed file.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
