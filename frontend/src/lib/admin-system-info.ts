import { PUBLIC_API_BASE, SERVER_API_BASE } from "@/lib/api-base";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Non-secret flags for the admin System tab (server-computed). */
export type AdminSystemInfo = {
  nodeEnv: string;
  publicApiBase: string;
  serverApiBase: string;
  serverApiUrlOverridden: boolean;
  supabaseConfigured: boolean;
  mockProEnabled: boolean;
  adminApiKeyConfigured: boolean;
  ingestApiKeyConfigured: boolean;
};

export function buildAdminSystemInfo(): AdminSystemInfo {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    publicApiBase: PUBLIC_API_BASE,
    serverApiBase: SERVER_API_BASE,
    serverApiUrlOverridden: Boolean(process.env.API_URL?.length),
    supabaseConfigured: isSupabaseConfigured(),
    mockProEnabled: process.env.NEXT_PUBLIC_MOCK_PRO === "true",
    adminApiKeyConfigured: Boolean(process.env.ADMIN_API_KEY?.length),
    ingestApiKeyConfigured: Boolean(process.env.INGEST_API_KEY?.length),
  };
}
