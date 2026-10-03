import { AdminRegisterForm } from "./AdminRegisterForm";

export default function AdminRegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-zinc-50">Admin registration</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Internal ops accounts require the server <code className="text-zinc-300">ADMIN_REGISTRATION_CODE</code>.
        With <code className="text-zinc-300">SUPABASE_SERVICE_ROLE_KEY</code>, new users receive the admin role
        automatically.
      </p>
      <AdminRegisterForm />
    </div>
  );
}
