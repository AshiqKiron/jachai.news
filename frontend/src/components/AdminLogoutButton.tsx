"use client";

import { useRouter } from "next/navigation";

import { adminSurfacePath } from "@/lib/admin-host";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await Promise.all([
      fetch("/api/admin/logout", { method: "POST" }),
      fetch("/api/auth/signout", { method: "POST" }),
    ]);
    router.push(adminSurfacePath("login", typeof window !== "undefined" ? window.location.hostname : undefined));
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
    >
      Sign out
    </button>
  );
}
