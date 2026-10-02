import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl text-zinc-50">Sign in</h1>
        <p className="mt-2 font-bengali text-zinc-400">লগ ইন</p>
      </div>
      <p className="text-sm text-zinc-400">
        Account sign-in via Supabase is coming soon. Set{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> when auth is enabled.
      </p>
      <p className="text-sm text-zinc-500">
        New here?{" "}
        <Link href="/sign-up" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
