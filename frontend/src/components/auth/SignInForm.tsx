"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { formatAuthError } from "@/lib/auth-errors";
import { normalizeEmail, safeAuthRedirectPath, validateSignInCredentials } from "@/lib/auth-input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { authFormClassName, authInputClassName, authSubmitClassName } from "./auth-form-styles";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthRedirectPath(searchParams.get("next"), "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserSupabaseClient();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const validation = validateSignInCredentials(email, password);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (signInError) throw signInError;
      router.push(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      setError(formatAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  if (!supabase) {
    return (
      <p className="mt-8 rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-400">
        Set <code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
        <code className="text-zinc-300">.env.local</code> to enable accounts.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={authFormClassName}>
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
      <p className="text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/sign-up" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
