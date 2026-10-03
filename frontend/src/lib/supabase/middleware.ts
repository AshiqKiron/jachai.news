import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "../database.types";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<{ response: NextResponse; user: { email?: string | null; app_metadata?: Record<string, unknown> } | null }> {
  if (!isSupabaseConfigured()) {
    return { response, user: null };
  }

  let supabaseResponse = response;

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response: supabaseResponse, user };
  } catch {
    return { response, user: null };
  }
}
