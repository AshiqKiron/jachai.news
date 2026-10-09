import Link from "next/link";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { MyNewsBiasDashboard } from "@/components/profile/MyNewsBiasDashboard";
import { getProAccessState } from "@/lib/subscription-access";

export const metadata = {
  title: "Profile · My News Bias",
  description:
    "Personal reading habits, followed stories, topics, and people — plus Shorup Pro preferences on this device.",
};

export default async function ProfilePage() {
  const pro = await getProAccessState();
  const displayName = pro.displayName ?? "Shorup reader";

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="text-accent hover:underline">
          Home
        </Link>
        <span aria-hidden> · </span>
        <span className="font-bengali">প্রোফাইল</span>
      </p>
      <ClientErrorBoundary title="Profile dashboard could not load">
        <MyNewsBiasDashboard displayName={displayName} isPro={pro.isPro} proKnown />
      </ClientErrorBoundary>
    </div>
  );
}
