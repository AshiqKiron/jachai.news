"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await Promise.all([
      fetch("/api/admin/logout", { method: "POST" }),
      fetch("/api/auth/signout", { method: "POST" }),
    ]);
    router.push("/admin/login");
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
