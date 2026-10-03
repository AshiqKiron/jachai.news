"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { authFormClassName, authInputClassName, authSubmitClassName } from "@/components/auth/auth-form-styles";
import { formatAuthError } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoginMode = "account" | "password";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [mode, setMode] = useState<LoginMode>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [opsPassword, setOpsPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserSupabaseClient();

  async function onAccountSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Use ops password sign-in or set NEXT_PUBLIC_SUPABASE_*.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const verify = await fetch("/api/admin/verify");
      if (!verify.ok) {
        await supabase.auth.signOut();
        await fetch("/api/auth/signout", { method: "POST" });
        const data = (await verify.json()) as { error?: string };
        throw new Error(data.error ?? "This account does not have admin access.");
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(formatAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  async function onOpsPasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: opsPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Login failed.");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex gap-2 rounded-xl border border-zinc-800 bg-ink-900/50 p-1">
        <button
          type="button"
          onClick={() => setMode("account")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${
            mode === "account" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Email account
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${
            mode === "password" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Ops password
        </button>
      </div>

      {mode === "account" ? (
        <form onSubmit={onAccountSubmit} className={authFormClassName}>
          <label className="block text-sm text-zinc-300">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={authInputClassName}
              required
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={authInputClassName}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" disabled={loading} className={authSubmitClassName}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onOpsPasswordSubmit} className={authFormClassName}>
          <label className="block text-sm text-zinc-300">
            Ops password
            <input
              type="password"
              autoComplete="current-password"
              value={opsPassword}
              onChange={(event) => setOpsPassword(event.target.value)}
              className={authInputClassName}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" disabled={loading} className={authSubmitClassName}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-zinc-500">
        Need an admin account?{" "}
        <Link href="/admin/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
