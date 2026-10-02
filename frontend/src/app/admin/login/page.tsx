import { Suspense } from "react";

import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-zinc-50">Admin sign-in</h1>
      <p className="mt-2 text-sm text-zinc-400">Internal operations dashboard for Jachai News.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
