import { redirect } from "next/navigation";

import { AdminIngestPanel } from "@/components/AdminIngestPanel";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { isAdminRouteAuthorized } from "@/lib/admin-route-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminRouteAuthorized())) {
    redirect("/admin/login?next=/admin");
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Internal</p>
          <h1 className="font-display text-3xl text-zinc-50">Operations</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Database stats, feed health, and manual RSS ingest.
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      <AdminDashboardPanel />

      <ClientErrorBoundary title="Ingest panel could not load">
        <AdminIngestPanel />
      </ClientErrorBoundary>
    </div>
  );
}
