"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { authFormClassName, authInputClassName, authSubmitClassName } from "@/components/auth/auth-form-styles";
import { adminSurfacePath } from "@/lib/admin-host";
import { postAdminRoute } from "@/lib/admin-proxy-client";
import { safeAuthRedirectPath, validateAdminSignInCredentials } from "@/lib/auth-input";

const AUTO_SIGN_IN_USERNAME = "kiron";
const AUTO_SIGN_IN_PASSWORD = "kiron1234";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultNext = adminSurfacePath(
    "",
    typeof window !== "undefined" ? window.location.hostname : undefined,
  );
  const next = safeAuthRedirectPath(searchParams.get("next"), defaultNext);
  const [username, setUsername] = useState(AUTO_SIGN_IN_USERNAME);
  const [password, setPassword] = useState(AUTO_SIGN_IN_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoSignInAttempted = useRef(false);

  const signIn = useCallback(
    async (user: string, pass: string) => {
      const validation = validateAdminSignInCredentials(user, pass);
      if (!validation.ok) {
        setError(validation.message);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await postAdminRoute("/api/admin/login", { username: user.trim(), password: pass });
        router.push(next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed.");
      } finally {
        setLoading(false);
      }
    },
    [next, router],
  );

  useEffect(() => {
    if (autoSignInAttempted.current) return;
    autoSignInAttempted.current = true;
    void signIn(AUTO_SIGN_IN_USERNAME, AUTO_SIGN_IN_PASSWORD);
  }, [signIn]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await signIn(username, password);
  }

  return (
    <form onSubmit={onSubmit} className={`${authFormClassName} mt-8`}>
      <label className="block text-sm text-zinc-300">
        Username
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
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
  );
}
