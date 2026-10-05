import { Suspense } from "react";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="page-title">Admin sign-in</h1>
      <p className="mt-2 text-sm text-zinc-400">Internal operations dashboard for Shorup News.</p>
      <ClientErrorBoundary title="Admin sign-in could not load">
        <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
          <AdminLoginForm />
        </Suspense>
      </ClientErrorBoundary>
    </div>
  );
}
