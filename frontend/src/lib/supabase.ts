import { createBrowserSupabaseClient } from "./supabase/client";

/** Browser Supabase client — null when URL/anon key are not configured. */
export const supabase = createBrowserSupabaseClient();

export { createBrowserSupabaseClient } from "./supabase/client";
export { createServerSupabaseClient } from "./supabase/server";
export { isSupabaseConfigured } from "./supabase/config";
