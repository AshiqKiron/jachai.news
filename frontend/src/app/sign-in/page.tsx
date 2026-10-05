import { Suspense } from "react";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Sign in</h1>
        <p className="mt-2 font-bengali text-zinc-400">লগ ইন</p>
      </div>
      <p className="text-sm text-zinc-400">
        Sign in to sync Shorup Pro billing and saved preferences when checkout goes live.
      </p>
      <ClientErrorBoundary title="Sign-in form could not load">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <SignInForm />
        </Suspense>
      </ClientErrorBoundary>
    </div>
  );
}
