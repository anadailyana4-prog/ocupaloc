"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const isHomepage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setSession(null);
        return;
      }

      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();
      setSession(currentSession ?? null);
    })();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (isHomepage || isDashboard) {
    return null;
  }

  return (
    <header className="border-b border-amber-200/15 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide text-amber-100">
          OcupaLoc
        </Link>
        {isAuthPage ? null : session === null ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full border-amber-200/25 bg-slate-900/50 text-amber-50 hover:bg-slate-800/70">
              <Link href="/login">Intră în cont</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 text-slate-900 hover:brightness-105">
              <Link href="/signup?start=1">Creează cont</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/20 bg-slate-800 text-xs font-semibold text-amber-100">
              {initialsFromEmail(session.user.email)}
            </div>
            <span className="hidden text-sm text-amber-50/80 sm:inline">{session.user.email ?? "utilizator"}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-amber-200/25 bg-slate-900/50 text-amber-50 hover:bg-slate-800/70"
              onClick={() => void handleSignOut()}
            >
              Ieși din cont
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
