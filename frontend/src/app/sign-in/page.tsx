import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl text-zinc-50">Sign in</h1>
        <p className="mt-2 font-bengali text-zinc-400">লগ ইন</p>
      </div>
      <p className="text-sm text-zinc-400">
        Sign in to sync Jachai Pro billing and saved preferences when checkout goes live.
      </p>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
