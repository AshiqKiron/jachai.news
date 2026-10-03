import type { AdminOverview } from "@/lib/admin-api";
import type { AdminSystemInfo } from "@/lib/admin-system-info";

export type AdminIssueSeverity = "critical" | "warning" | "info";

export type AdminIssue = {
  id: string;
  severity: AdminIssueSeverity;
  title: string;
  detail: string;
  relatedTab: "general" | "system" | "overview" | "users";
};

const STALE_ARTICLE_HOURS = 72;

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function collectAdminIssues(input: {
  overview: AdminOverview | null;
  apiHealthy: boolean;
  loadError: boolean;
  systemInfo: AdminSystemInfo;
}): AdminIssue[] {
  const { overview, apiHealthy, loadError, systemInfo } = input;
  const issues: AdminIssue[] = [];

  if (!apiHealthy) {
    issues.push({
      id: "api-unreachable",
      severity: "critical",
      title: "Backend API unreachable",
      detail:
        "The frontend cannot reach the FastAPI health check. Start the API (npm run dev:backend or stack:up) and verify API_URL on the Next server.",
      relatedTab: "system",
    });
  }

  if (!overview) {
    issues.push({
      id: "overview-missing",
      severity: apiHealthy ? "warning" : "critical",
      title: "Admin overview not loaded",
      detail:
        "GET /api/v1/admin/overview failed. Check ADMIN_API_KEY matches the backend and that migrations have run.",
      relatedTab: "system",
    });
  }

  if (loadError && overview) {
    issues.push({
      id: "overview-stale",
      severity: "warning",
      title: "Could not refresh dashboard stats",
      detail: "The last successful overview is shown. Retry refresh or check network and admin credentials.",
      relatedTab: "overview",
    });
  }

  if (overview) {
    if (overview.ai_provider === "groq" && !overview.groq_configured) {
      issues.push({
        id: "groq-key-missing",
        severity: "warning",
        title: "Groq API key missing",
        detail: "Set GROQ_API_KEY on the backend for clustering summaries and claim verification.",
        relatedTab: "system",
      });
    }
    if (overview.ai_provider === "gemini" && !overview.gemini_configured) {
      issues.push({
        id: "gemini-key-missing",
        severity: "warning",
        title: "Gemini API key missing",
        detail: "Set GEMINI_API_KEY on the backend or switch AI_PROVIDER to groq.",
        relatedTab: "system",
      });
    }

    if (overview.latest_article_at && hoursSince(overview.latest_article_at) > STALE_ARTICLE_HOURS) {
      issues.push({
        id: "ingest-stale",
        severity: "warning",
        title: "No recent articles ingested",
        detail: `Latest article is older than ${STALE_ARTICLE_HOURS}h. Run RSS ingest from the General tab or schedule POST /api/v1/ingest.`,
        relatedTab: "general",
      });
    } else if (!overview.latest_article_at && overview.articles_total === 0) {
      issues.push({
        id: "no-articles",
        severity: "warning",
        title: "Database has no articles",
        detail: "Run ingest after confirming RSS sources are active in the General tab.",
        relatedTab: "general",
      });
    }

    const active = overview.sources.filter((s) => !s.disabled);
    const disabled = overview.sources.filter((s) => s.disabled);
    if (overview.sources.length > 0 && active.length === 0) {
      issues.push({
        id: "all-sources-disabled",
        severity: "warning",
        title: "All RSS sources are disabled",
        detail: "Re-add or re-enable feeds in the General tab so ingest can fetch headlines.",
        relatedTab: "general",
      });
    }

    const emptyActive = active.filter((s) => s.article_count === 0);
    if (emptyActive.length > 0 && active.length > 0) {
      issues.push({
        id: "empty-source-feeds",
        severity: "info",
        title: `${emptyActive.length} active source(s) with no articles`,
        detail: `Feeds with zero articles: ${emptyActive.map((s) => s.name).join(", ")}. Run ingest or verify feed URLs.`,
        relatedTab: "general",
      });
    }

    if (disabled.length > 0) {
      issues.push({
        id: "disabled-sources",
        severity: "info",
        title: `${disabled.length} disabled source(s)`,
        detail: "Disabled feeds are skipped during ingest. Re-add the same name to re-enable seed sources.",
        relatedTab: "general",
      });
    }
  }

  if (!systemInfo.adminApiKeyConfigured && apiHealthy) {
    issues.push({
      id: "admin-key-open",
      severity: "info",
      title: "Admin API key not set on frontend",
      detail:
        "ADMIN_API_KEY is unset in the Next server env. Fine for local dev; set it in production to match the backend.",
      relatedTab: "system",
    });
  }

  if (!systemInfo.supabaseConfigured) {
    issues.push({
      id: "supabase-unconfigured",
      severity: "info",
      title: "Supabase auth not configured",
      detail: "NEXT_PUBLIC_SUPABASE_URL and anon key are missing. Sign-in and Pro billing will not work until configured.",
      relatedTab: "system",
    });
  } else if (!systemInfo.supabaseServiceRoleConfigured) {
    issues.push({
      id: "supabase-service-role-missing",
      severity: "warning",
      title: "Supabase service role key missing",
      detail:
        "Set SUPABASE_SERVICE_ROLE_KEY on the Next server to list, create, and delete users from the Users tab.",
      relatedTab: "users",
    });
  }

  const rank: Record<AdminIssueSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function countIssuesBySeverity(issues: AdminIssue[]): {
  critical: number;
  warning: number;
  info: number;
} {
  return issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 },
  );
}
