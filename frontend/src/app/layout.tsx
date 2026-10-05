import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Noto_Sans_Bengali } from "next/font/google";

import { InstallPWA } from "@/components/InstallPWA";
import { MobileNav } from "@/components/MobileNav";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DEV_UNREGISTER_STALE_SERVICE_WORKER_SCRIPT } from "@/lib/chunk-load-error";
import "@/styles/globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Newsreader({ subsets: ["latin"], variable: "--font-display" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali" });

export const metadata: Metadata = {
  title: "Shorup News — Bangladesh multi-source news",
  description:
    "Compare Bangladeshi headlines across outlets. Bias signals, blindspots, and rumor flags — Ground News for BD.",
  applicationName: "Shorup News",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shorup",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ecfdf9" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      className={`${sans.variable} ${display.variable} ${bengali.variable}`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NODE_ENV === "development" ? (
          <script dangerouslySetInnerHTML={{ __html: DEV_UNREGISTER_STALE_SERVICE_WORKER_SCRIPT }} />
        ) : null}
      </head>
      <body className="min-h-screen overflow-x-hidden font-sans pb-20 md:pb-0">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="system")localStorage.setItem("theme","light")}catch(e){}`,
          }}
        />
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-8 md:py-10">{children}</main>
          <MobileNav />
          <InstallPWA />
        </ThemeProvider>
      </body>
    </html>
  );
}
