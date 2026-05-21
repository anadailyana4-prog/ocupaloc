"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signout?all=true", { method: "POST", credentials: "include" });
      if (!res.ok) {
        // Force client-side sign out even if server endpoint fails
        const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
        await createSupabaseBrowserClient().auth.signOut();
      }
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
    window.location.replace("/login");
  }

  return (
    <header className="border-b oc-border oc-bg backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight oc-accent">
            OcupaLoc
          </Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm oc-secondary-text flex-wrap">
            <Link href="/dashboard" prefetch className="transition hover:oc-accent">
              Acasă
            </Link>
            <Link href="/dashboard/servicii" prefetch className="transition hover:oc-accent">
              Servicii
            </Link>
            <Link href="/dashboard/program" prefetch className="transition hover:oc-accent">
              Program
            </Link>
            <Link href="/dashboard/billing" prefetch className="transition hover:oc-accent">
              Billing
            </Link>
            <Link href="/dashboard/pagina" prefetch className="transition hover:oc-accent hidden sm:inline">
              Pagină publică
            </Link>
            <Link href="/dashboard/preview" prefetch className="transition hover:oc-accent hidden sm:inline">
              Previzualizare
            </Link>
            <Link href="/dashboard/setari" prefetch className="transition hover:oc-accent hidden sm:inline">
              Setări
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="oc-text border-oc-border">
            ← Înapoi
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
            {loading ? "Se iese…" : "Ieși din cont"}
          </Button>
        </div>
      </div>
      {/* Mobile nav — visible only below sm breakpoint */}
      <nav className="flex sm:hidden items-center gap-4 overflow-x-auto px-4 pb-2 text-sm oc-secondary-text whitespace-nowrap">
        <Link href="/dashboard" prefetch className="transition hover:oc-accent py-1">
          Acasă
        </Link>
        <Link href="/dashboard/servicii" prefetch className="transition hover:oc-accent py-1">
          Servicii
        </Link>
        <Link href="/dashboard/program" prefetch className="transition hover:oc-accent py-1">
          Program
        </Link>
        <Link href="/dashboard/billing" prefetch className="transition hover:oc-accent py-1">
          Billing
        </Link>
        <Link href="/dashboard/pagina" prefetch className="transition hover:oc-accent py-1">
          Pagină publică
        </Link>
        <Link href="/dashboard/preview" prefetch className="transition hover:oc-accent py-1">
          Previzualizare
        </Link>
        <Link href="/dashboard/setari" prefetch className="transition hover:oc-accent py-1">
          Setări
        </Link>
      </nav>
    </header>
  );
}
