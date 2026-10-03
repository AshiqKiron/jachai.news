"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { formatAuthError } from "@/lib/auth-errors";
import { normalizeEmail, validateSignUpFields } from "@/lib/auth-input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { authFormClassName, authInputClassName, authSubmitClassName } from "./auth-form-styles";

export function SignUpForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserSupabaseClient();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const validation = validateSignUpFields(email, password, displayName);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: { display_name: displayName.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setNotice("Check your email to confirm your account, then sign in.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed.";
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
        <code className="text-zinc-300">.env.local</code> to enable registration.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={authFormClassName}>
      <label className="block text-sm text-zinc-300">
        Display name
        <input
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={authInputClassName}
        />
      </label>
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
          minLength={6}
          required
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
      <button type="submit" disabled={loading} className={authSubmitClassName}>
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
