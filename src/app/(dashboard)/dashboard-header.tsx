"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
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
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          OcupaLoc
        </Link>
        <nav className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
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
      <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
        {loading ? "Se iese…" : "Ieși din cont"}
      </Button>
    </header>
  );
}
