"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BillingStatus = {
  connected: boolean;
  mode: "test" | "live" | "unknown";
  issues: string[];
};

export function OwnerLayout({
  children,
  billingStatus
}: {
  children: React.ReactNode;
  billingStatus?: BillingStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/owner/login");
        return;
      }

      // Check if user is owner admin
      const { data } = await supabase
        .from("owner_admin_users")
        .select("role, is_active")
        .eq("user_id", user.id)
        .single();

      if (!data || !data.is_active || !["owner", "admin"].includes(data.role)) {
        router.push("/owner/login");
        return;
      }

      setEmail(user.email ?? null);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/owner/login");
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-slate-300">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/owner/dashboard", icon: "📊" },
    { label: "Businesses", href: "/owner/businesses", icon: "🏢" },
    { label: "Subscriptions", href: "/owner/subscriptions", icon: "💳" },
    { label: "Trials", href: "/owner/trials", icon: "⏳" },
    { label: "Activity", href: "/owner/activity", icon: "📈" },
    { label: "Revenue", href: "/owner/revenue", icon: "💰" },
    { label: "Errors", href: "/owner/errors", icon: "⚠️" },
    { label: "Operations", href: "/owner/operations", icon: "🔧" },
    { label: "Settings", href: "/owner/settings", icon: "⚙️" }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4 overflow-y-auto">
        <div className="mb-8">
          <Link href="/owner/dashboard" className="text-xl font-bold tracking-wide text-amber-100">
            OcupaLoc Owner
          </Link>
          <p className="text-xs text-slate-400 mt-1">Control Center</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-amber-500/20 border-l-2 border-amber-400 text-amber-100"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-slate-700 pt-4">
          {billingStatus && (
            <div className="mb-3 flex items-center gap-1.5 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${billingStatus.connected ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className="text-slate-400">Stripe {billingStatus.connected ? billingStatus.mode : "not configured"}</span>
            </div>
          )}
          <p className="text-xs text-slate-400 truncate">{email}</p>
          <Button
            onClick={() => void handleLogout()}
            variant="outline"
            size="sm"
            className="mt-2 w-full bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
