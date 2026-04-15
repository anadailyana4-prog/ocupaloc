"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function initialsFromEmail(email: string | null | undefined): string {
  const value = (email ?? "").trim();
  if (!value) return "?";
  return value.charAt(0).toUpperCase();
}

export function Header() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Ocuploc
        </Link>
        {session === null ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/login">Intră în cont</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/signup">Creează cont</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
              {initialsFromEmail(session.user.email)}
            </div>
            <span className="hidden text-sm text-zinc-300 sm:inline">{session.user.email ?? "utilizator"}</span>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void handleSignOut()}>
              Ieși din cont
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
