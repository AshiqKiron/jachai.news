"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteAdminRoute,
  getAdminRoute,
  patchAdminRoute,
  postAdminRoute,
} from "@/lib/admin-proxy-client";
import type { AdminUserPlan, AdminUserRecord, AdminUsersListResponse } from "@/lib/admin-user-types";
import { validateSignUpFields } from "@/lib/auth-input";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

type Props = {
  supabaseConfigured: boolean;
};

export function AdminUsersPanel({ supabaseConfigured }: Props) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [configured, setConfigured] = useState(supabaseConfigured);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newUserPlan, setNewUserPlan] = useState<AdminUserPlan>("free");
  const [creating, setCreating] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getAdminRoute<AdminUsersListResponse>("/api/admin/users");
      setConfigured(payload.configured);
      setUsers(payload.users);
      if (payload.error) setError(payload.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateSignUpFields(email, password, displayName);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await postAdminRoute<AdminUserRecord>("/api/admin/users", {
        email,
        password,
        displayName: displayName.trim() || undefined,
        plan: newUserPlan,
      });
      setEmail("");
      setPassword("");
      setDisplayName("");
      setNewUserPlan("free");
      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
      setMessage(`Created ${created.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handlePlanChange(user: AdminUserRecord, plan: AdminUserPlan) {
    if (user.plan === plan) return;
    setUpdatingId(user.id);
    setError(null);
    setMessage(null);
    try {
      await patchAdminRoute("/api/admin/users/" + encodeURIComponent(user.id), { plan });
      setUsers((prev) =>
        prev.map((row) =>
          row.id === user.id
            ? {
                ...row,
                plan,
                subscriptionStatus: plan === "pro" ? "active" : null,
                subscriptionPlan: plan === "pro" ? row.subscriptionPlan ?? "monthly" : null,
              }
            : row,
        ),
      );
      setMessage(`Updated plan for ${user.email}.`);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(user: AdminUserRecord) {
    const confirmed = window.confirm(
      `Delete ${user.email}? This removes their auth account, profile, and subscription data.`,
    );
    if (!confirmed) return;

    setRemovingId(user.id);
    setError(null);
    setMessage(null);
    try {
      await deleteAdminRoute("/api/admin/users/" + encodeURIComponent(user.id));
      setUsers((prev) => prev.filter((row) => row.id !== user.id));
      setMessage(`Deleted ${user.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setRemovingId(null);
    }
  }

  if (!configured) {
    return (
      <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
        User management requires Supabase. Set{" "}
        <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
        <code className="text-amber-100">SUPABASE_SERVICE_ROLE_KEY</code> on the Next server (see{" "}
        <code className="text-amber-100">frontend/.env.example</code>).
      </p>
    );
  }

  const proCount = users.filter((u) => u.plan === "pro").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total users</p>
          <p className="mt-2 text-2xl font-medium text-zinc-50">{loading ? "…" : String(users.length)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Pro</p>
          <p className="mt-2 text-2xl font-medium text-zinc-50">{loading ? "…" : String(proCount)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Free</p>
          <p className="mt-2 text-2xl font-medium text-zinc-50">
            {loading ? "…" : String(users.length - proCount)}
          </p>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Add user</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm text-zinc-400">
            Email
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
              required
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
              required
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Plan
            <select
              value={newUserPlan}
              onChange={(e) => setNewUserPlan(e.target.value as AdminUserPlan)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Accounts</h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="text-xs text-accent hover:underline disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-ink-900/80 text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-zinc-500">
                    Loading users…
                  </td>
                </tr>
              ) : null}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-zinc-500">
                    No users yet.
                  </td>
                </tr>
              ) : null}
              {users.map((user) => (
                <tr key={user.id} className="bg-ink-900/30">
                  <td className="px-4 py-3 text-zinc-100">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.displayName ?? <span className="text-zinc-500">—</span>}
                    <span className="ml-2 text-xs text-zinc-600">{user.locale}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.plan}
                      disabled={updatingId === user.id}
                      onChange={(e) => void handlePlanChange(user, e.target.value as AdminUserPlan)}
                      className="rounded-md border border-zinc-700 bg-ink-950 px-2 py-1 text-sm text-zinc-100 disabled:opacity-60"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">{formatWhen(user.signedUpAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {formatWhen(user.lastSignInAt)}
                  </td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">Admin</span>
                    ) : (
                      <span className="text-zinc-500">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={removingId === user.id}
                      onClick={() => void handleRemove(user)}
                      className="text-xs text-red-400 hover:underline disabled:opacity-50"
                    >
                      {removingId === user.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
