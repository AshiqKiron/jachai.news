/**
 * Pro entitlement check — replace with Supabase subscription status when checkout ships.
 * Set NEXT_PUBLIC_MOCK_PRO=true in .env.local to preview Pro UI locally.
 */
export function hasProAccess(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_PRO === "true";
}
