import { createClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "./config";

/** Server-only — never expose SUPABASE_SERVICE_ROLE_KEY to the client. */
export function createServiceRoleSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured() || !serviceKey?.length) return null;
  return createClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
