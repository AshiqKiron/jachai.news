import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Sign up</h1>
        <p className="mt-2 font-bengali text-zinc-400">নতুন অ্যাকাউন্ট</p>
      </div>
      <ClientErrorBoundary title="Sign-up form could not load">
        <SignUpForm />
      </ClientErrorBoundary>
    </div>
  );
}
