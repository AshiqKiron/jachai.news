/** Production admin UI host (subdomain). Override with ADMIN_HOST / NEXT_PUBLIC_ADMIN_HOST. */

const DEFAULT_PRODUCTION_ADMIN_HOST = "admin.jachai.news";

export function hostnameWithoutPort(host: string): string {
  return host.split(":")[0].toLowerCase();
}

/** When set, `/admin` on the main site redirects here and the host serves the admin app at `/`. */
export function adminHostname(): string | null {
  const fromEnv = process.env.ADMIN_HOST ?? process.env.NEXT_PUBLIC_ADMIN_HOST;
  if (fromEnv?.trim()) {
    return hostnameWithoutPort(fromEnv.trim());
  }
  if (process.env.VERCEL_ENV === "production") {
    return DEFAULT_PRODUCTION_ADMIN_HOST;
  }
  return null;
}

export function isAdminSubdomainHost(host: string): boolean {
  const admin = adminHostname();
  if (!admin) return false;
  return hostnameWithoutPort(host) === admin;
}

export function adminSubdomainToInternalPath(pathname: string): string {
  if (pathname === "/") return "/admin";
  if (pathname === "/login") return "/admin/login";
  if (pathname === "/register") return "/admin/register";
  return pathname;
}

const ADMIN_PUBLIC_INTERNAL = new Set(["/admin/login", "/admin/register"]);

export function isAdminPublicInternalPath(internalPath: string): boolean {
  return ADMIN_PUBLIC_INTERNAL.has(internalPath);
}

export function isAdminInternalPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Whether the request should run admin auth (internal `/admin/*` or admin subdomain surface). */
export function resolvesToAdminInternalPath(pathname: string, host: string): boolean {
  if (isAdminInternalPath(pathname)) return true;
  if (!isAdminSubdomainHost(host)) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}

export function effectiveAdminInternalPath(pathname: string, host: string): string {
  if (isAdminSubdomainHost(host) && !pathname.startsWith("/api")) {
    return adminSubdomainToInternalPath(pathname);
  }
  return pathname;
}

export function isAdminAppSurface(pathname: string, host?: string): boolean {
  if (isAdminInternalPath(pathname)) return true;
  if (!host || !isAdminSubdomainHost(host)) return false;
  return !pathname.startsWith("/api");
}

export type AdminSurfaceSegment = "" | "login" | "register";

export function adminSurfacePath(segment: AdminSurfaceSegment, host?: string): string {
  const onAdmin = host ? isAdminSubdomainHost(host) : false;
  if (onAdmin) {
    if (segment === "") return "/";
    return `/${segment}`;
  }
  if (segment === "") return "/admin";
  return `/admin/${segment}`;
}

export function adminSubdomainPublicUrl(pathname: string): string | null {
  const admin = adminHostname();
  if (!admin) return null;
  const surface =
    pathname === "/admin"
      ? "/"
      : pathname.startsWith("/admin/")
        ? pathname.slice("/admin".length) || "/"
        : null;
  if (surface === null) return null;
  return `https://${admin}${surface}`;
}

const MAIN_SITE_PREFIXES = [
  "/browse",
  "/sign-in",
  "/sign-up",
  "/verify",
  "/story",
  "/blindspot",
  "/bias",
  "/rumors",
  "/pro",
  "/offline",
  "/auth",
];

export function isMainSiteAppPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MAIN_SITE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function mainSiteOriginFromRequest(host: string, fallbackOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (!isAdminSubdomainHost(host)) return fallbackOrigin;
  return "https://jachai.news";
}
