import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/admin-auth";
import type { AdminUserPlan, AdminUserRecord, AdminUsersListResponse } from "@/lib/admin-user-types";
import type { Database, SubscriptionPlan } from "@/lib/database.types";
import { isActiveProSubscription } from "@/lib/subscription-entitlement";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

const LIST_PAGE_SIZE = 100;

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function buildActiveSubscriptionRow(
  userId: string,
  plan: SubscriptionPlan = "monthly",
): Database["public"]["Tables"]["subscriptions"]["Insert"] {
  const start = new Date();
  const end = plan === "yearly" ? addYears(start, 1) : addMonths(start, 1);
  return {
    user_id: userId,
    plan,
    status: "active",
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
    cancel_at_period_end: false,
  };
}

function mapAuthUser(
  user: User,
  profile: { display_name: string | null; locale: string; created_at: string } | undefined,
  subscription: SubscriptionRow | undefined,
): AdminUserRecord {
  const pro = isActiveProSubscription(subscription ?? null);
  const role = user.app_metadata?.role;
  const isAdmin = role === "admin" || isAdminEmail(user.email);

  return {
    id: user.id,
    email: user.email ?? "—",
    displayName: profile?.display_name ?? null,
    locale: profile?.locale ?? "en",
    isAdmin,
    plan: pro ? "pro" : "free",
    subscriptionPlan: subscription?.plan ?? null,
    subscriptionStatus: subscription?.status ?? null,
    signedUpAt: profile?.created_at ?? user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

async function listAllAuthUsers(service: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>) {
  const users: User[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: LIST_PAGE_SIZE });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < LIST_PAGE_SIZE) break;
    page += 1;
  }
  return users;
}

export async function listAdminUsers(): Promise<AdminUsersListResponse> {
  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return {
      users: [],
      configured: false,
      error: "Set NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY to manage users.",
    };
  }

  try {
    const [authUsers, profilesResult, subscriptionsResult] = await Promise.all([
      listAllAuthUsers(service),
      service.from("profiles").select("id, display_name, locale, created_at"),
      service.from("subscriptions").select("*"),
    ]);

    if (profilesResult.error) throw new Error(profilesResult.error.message);
    if (subscriptionsResult.error) throw new Error(subscriptionsResult.error.message);

    const profileById = new Map(
      (profilesResult.data ?? []).map((row) => [
        row.id,
        {
          display_name: row.display_name,
          locale: row.locale,
          created_at: row.created_at,
        },
      ]),
    );
    const subscriptionByUser = new Map(
      (subscriptionsResult.data ?? []).map((row) => [row.user_id, row as SubscriptionRow]),
    );

    const users = authUsers
      .map((user) => mapAuthUser(user, profileById.get(user.id), subscriptionByUser.get(user.id)))
      .sort((a, b) => new Date(b.signedUpAt).getTime() - new Date(a.signedUpAt).getTime());

    return { users, configured: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list users.";
    return { users: [], configured: true, error: message };
  }
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  displayName?: string;
  plan?: AdminUserPlan;
}): Promise<AdminUserRecord> {
  const service = createServiceRoleSupabaseClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await service.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: input.displayName ? { display_name: input.displayName } : undefined,
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not create user.");
  }

  const userId = data.user.id;
  if (input.displayName?.trim()) {
    await service
      .from("profiles")
      .update({ display_name: input.displayName.trim() })
      .eq("id", userId);
  }

  if (input.plan === "pro") {
    const row = buildActiveSubscriptionRow(userId);
    const { error: subError } = await service.from("subscriptions").insert(row);
    if (subError) throw new Error(subError.message);
  }

  const { data: profile } = await service
    .from("profiles")
    .select("display_name, locale, created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: subscription } = await service
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return mapAuthUser(
    data.user,
    profile
      ? {
          display_name: profile.display_name,
          locale: profile.locale,
          created_at: profile.created_at,
        }
      : undefined,
    subscription as SubscriptionRow | undefined,
  );
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const service = createServiceRoleSupabaseClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export async function setAdminUserPlan(userId: string, plan: AdminUserPlan): Promise<void> {
  const service = createServiceRoleSupabaseClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }

  if (plan === "free") {
    const { error } = await service.from("subscriptions").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return;
  }

  const existing = await service.from("subscriptions").select("plan").eq("user_id", userId).maybeSingle();
  const billingPlan = (existing.data?.plan as SubscriptionPlan | undefined) ?? "monthly";
  const row = buildActiveSubscriptionRow(userId, billingPlan);

  const { error } = await service.from("subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function updateAdminUserProfile(
  userId: string,
  input: { displayName?: string },
): Promise<void> {
  const service = createServiceRoleSupabaseClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }
  if (input.displayName !== undefined) {
    const trimmed = input.displayName.trim();
    const { error } = await service
      .from("profiles")
      .update({ display_name: trimmed.length ? trimmed : null })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }
}
