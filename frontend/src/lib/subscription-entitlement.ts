import type { SubscriptionEntitlementRow, SubscriptionStatus } from "@/lib/database.types";

const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing"]);

/** Pure check — active/trialing and current period not expired. */
export function isActiveProSubscription(
  subscription: SubscriptionEntitlementRow | null | undefined,
): boolean {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.has(subscription.status)) return false;

  const periodEnd = new Date(subscription.current_period_end);
  if (Number.isNaN(periodEnd.getTime())) return false;
  return periodEnd.getTime() > Date.now();
}
