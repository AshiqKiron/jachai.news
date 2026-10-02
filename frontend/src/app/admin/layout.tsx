import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Jachai News",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 pb-8">{children}</div>;
}
