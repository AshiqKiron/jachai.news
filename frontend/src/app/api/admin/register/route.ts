import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const registrationCode = process.env.ADMIN_REGISTRATION_CODE;
  if (!registrationCode?.length) {
    return NextResponse.json(
      { error: "Admin registration is not enabled (set ADMIN_REGISTRATION_CODE)." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    displayName?: string;
    registrationCode?: string;
  };

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const displayName = body.displayName?.trim();
  const code = body.registrationCode ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (code !== registrationCode) {
    return NextResponse.json({ error: "Invalid registration code." }, { status: 403 });
  }

  const service = createServiceRoleSupabaseClient();
  if (service) {
    const { error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: displayName ? { display_name: displayName } : undefined,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or SUPABASE_SERVICE_ROLE_KEY for admin signup.",
      },
      { status: 503 },
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=/admin`,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    notice:
      "Account created. Add this email to ADMIN_EMAILS (or set SUPABASE_SERVICE_ROLE_KEY for automatic admin role) before signing in to /admin.",
  });
}
