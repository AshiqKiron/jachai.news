import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl text-zinc-50">Sign up</h1>
        <p className="mt-2 font-bengali text-zinc-400">নতুন অ্যাকাউন্ট</p>
      </div>
      <p className="text-sm text-zinc-400">
        Registration will unlock Jachai Pro billing and saved outlets. Supabase auth integration is
        planned — checkout is not live yet.
      </p>
      <p className="text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
