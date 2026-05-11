"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if already logged in as owner
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      // Check if owner
      const { data } = await supabase
        .from("owner_admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (data && ["owner", "admin"].includes(data.role)) {
        setIsRedirecting(true);
        router.push("/owner/dashboard");
      }
    };

    checkAuth();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Verify owner access
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Failed to get user info");
        setLoading(false);
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("owner_admin_users")
        .select("role, is_active")
        .eq("user_id", user.id)
        .single();

      if (
        adminError ||
        !adminData ||
        !adminData.is_active ||
        !["owner", "admin"].includes(adminData.role)
      ) {
        setError(
          "You do not have owner or admin access. Please contact support."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/owner/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Login failed");
      setLoading(false);
    }
  }

  if (isRedirecting) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-slate-300">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-wide text-amber-100">
            OcupaLoc
          </h1>
          <p className="text-sm text-slate-400 mt-1">Owner Control Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Login</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-950/30 border border-red-900/50 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
              This portal is for authorized administrators only.
              <br />
              Unauthorized access attempts are logged.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
