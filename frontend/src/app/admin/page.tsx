import { redirect } from "next/navigation";

import { AdminIngestPanel } from "@/components/AdminIngestPanel";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { fetchAdminOverview, fetchApiHealth } from "@/lib/admin-api";
import { isAdminRouteAuthorized } from "@/lib/admin-route-auth";
import { buildAdminSystemInfo } from "@/lib/admin-system-info";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminRouteAuthorized())) {
    redirect("/admin/login?next=/admin");
  }

  const [overview, apiHealthy] = await Promise.all([fetchAdminOverview(), fetchApiHealth()]);
  const systemInfo = buildAdminSystemInfo();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Internal</p>
          <h1 className="font-display text-3xl text-zinc-50">Operations</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Overview, RSS feeds, system status, and ops issues.
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      <AdminDashboardPanel
        initialOverview={overview}
        initialApiHealthy={apiHealthy}
        systemInfo={systemInfo}
        ingestPanel={
          <ClientErrorBoundary title="Ingest panel could not load">
            <AdminIngestPanel />
          </ClientErrorBoundary>
        }
      />
    </div>
  );
}
