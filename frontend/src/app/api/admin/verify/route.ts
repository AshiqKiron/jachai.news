import { NextResponse } from "next/server";

import { isSupabaseAdminUser } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isSupabaseAdminUser(user)) {
    return NextResponse.json({ error: "This account does not have admin access." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, email: user?.email });
}
