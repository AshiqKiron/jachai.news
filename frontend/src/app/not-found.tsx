import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="font-display text-2xl text-zinc-50">Page not found</h1>
      <p className="text-sm leading-relaxed text-zinc-400">
        This route does not exist. Head back to the home feed or use the menu to explore stories.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
      >
        Home
      </Link>
    </div>
  );
}
