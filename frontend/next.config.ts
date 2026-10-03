import path from "node:path";

import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security-headers";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
});

const backendOrigin = (process.env.API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/api\/v1\/?$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` },
      { source: "/backend-health", destination: `${backendOrigin}/health` },
    ];
  },
  async headers() {
    const base = Object.entries(securityHeaders()).map(([key, value]) => ({
      key,
      value,
    }));
    return [
      {
        source: "/:path*",
        headers: base,
      },
      {
        source: "/verify/:path*",
        headers: [
          ...base,
          {
            key: "Cache-Control",
            value: "public, s-maxage=120, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
};

const withPWAConfig = withPWA(nextConfig);

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withPWAConfig, sentryWebpackPluginOptions)
  : withPWAConfig;
