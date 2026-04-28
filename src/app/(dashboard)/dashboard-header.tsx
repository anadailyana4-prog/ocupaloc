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
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            OcupaLoc
          </Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
            <Link href="/dashboard" className="transition hover:text-zinc-100">
              Acasă
            </Link>
            <Link href="/dashboard/servicii" className="transition hover:text-zinc-100">
              Servicii
            </Link>
            <Link href="/dashboard/program" className="transition hover:text-zinc-100">
              Program
            </Link>
            <Link href="/dashboard/pagina" className="transition hover:text-zinc-100 hidden sm:inline">
              Pagină publică
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="text-zinc-300 border-zinc-600">
            ← Înapoi
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
            {loading ? "Se iese…" : "Ieși din cont"}
          </Button>
        </div>
      </div>
      {/* Mobile nav — visible only below sm breakpoint */}
      <nav className="flex sm:hidden items-center gap-4 overflow-x-auto px-4 pb-2 text-sm text-zinc-400 whitespace-nowrap">
        <Link href="/dashboard" className="transition hover:text-zinc-100 py-1">
          Acasă
        </Link>
        <Link href="/dashboard/servicii" className="transition hover:text-zinc-100 py-1">
          Servicii
        </Link>
        <Link href="/dashboard/program" className="transition hover:text-zinc-100 py-1">
          Program
        </Link>
        <Link href="/dashboard/pagina" className="transition hover:text-zinc-100 py-1">
          Pagină publică
        </Link>
      </nav>
    </header>
  );
}
