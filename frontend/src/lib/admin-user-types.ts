import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/database.types";

export type AdminUserPlan = "free" | "pro";

export type AdminUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  locale: string;
  isAdmin: boolean;
  plan: AdminUserPlan;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  signedUpAt: string;
  lastSignInAt: string | null;
};

export type AdminUsersListResponse = {
  users: AdminUserRecord[];
  configured: boolean;
  error?: string;
};
