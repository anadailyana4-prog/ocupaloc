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
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8">
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight text-zinc-50">
            Ocupaloc
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-medium text-zinc-400 md:flex">
            <Link href="/preturi" className="transition-colors hover:text-zinc-100">
              Prețuri
            </Link>
            <Link href="/#features" className="transition-colors hover:text-zinc-100">
              Cum funcționează
            </Link>
            <Link href="/blog" className="transition-colors hover:text-zinc-100">
              Blog
            </Link>
            <Link href="/despre" className="transition-colors hover:text-zinc-100">
              Despre
            </Link>
          </nav>
        </div>
        {session === null ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-full text-zinc-300 hover:text-white">
              <Link href="/login">Intră în cont</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-500">
              <Link href="/signup">Încearcă gratuit</Link>
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
