import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, hasAdminAccess, verifyAdminSession } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function isAdminRouteAuthorized(): Promise<boolean> {
  const session = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (await verifyAdminSession(session)) return true;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return hasAdminAccess(session, user);
}
