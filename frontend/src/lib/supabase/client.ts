import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../database.types";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
