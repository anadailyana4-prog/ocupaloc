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
    const res = await fetch("/api/auth/signout?all=true", { method: "POST", credentials: "include" });
    setLoading(false);
    if (!res.ok) {
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Ocupaloc
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-zinc-400 md:flex">
          <Link href="/dashboard" className="transition hover:text-zinc-100">
            Acasă
          </Link>
          <Link href="/dashboard/servicii" className="transition hover:text-zinc-100">
            Servicii
          </Link>
          <Link href="/dashboard/program" className="transition hover:text-zinc-100">
            Program
          </Link>
          <Link href="/dashboard/pagina" className="transition hover:text-zinc-100">
            Pagină publică
          </Link>
        </nav>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
        {loading ? "Se iese…" : "Logout"}
      </Button>
    </header>
  );
}
