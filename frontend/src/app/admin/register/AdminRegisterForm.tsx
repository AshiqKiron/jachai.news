"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { authFormClassName, authInputClassName, authSubmitClassName } from "@/components/auth/auth-form-styles";

export function AdminRegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          registrationCode,
        }),
      });
      const data = (await response.json()) as { error?: string; notice?: string };
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Registration failed.");
      }
      if (data.notice) {
        setNotice(data.notice);
        return;
      }
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={authFormClassName}>
      <label className="block text-sm text-zinc-300">
        Registration code
        <input
          type="password"
          autoComplete="off"
          value={registrationCode}
          onChange={(event) => setRegistrationCode(event.target.value)}
          className={authInputClassName}
          required
        />
      </label>
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
      {notice ? <p className="text-sm text-amber-300">{notice}</p> : null}
      <button type="submit" disabled={loading} className={authSubmitClassName}>
        {loading ? "Creating account…" : "Create admin account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/admin/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
