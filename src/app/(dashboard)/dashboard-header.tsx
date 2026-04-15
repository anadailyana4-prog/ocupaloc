"use client";

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
      <span className="text-sm font-semibold tracking-tight">Ocupaloc</span>
      <Button type="button" variant="outline" size="sm" onClick={() => void logout()} disabled={loading}>
        {loading ? "Se iese…" : "Logout"}
      </Button>
    </header>
  );
}
