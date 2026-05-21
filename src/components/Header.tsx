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
  const [isSigningOut, setIsSigningOut] = useState(false);
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
    setIsSigningOut(true);
    try {
      const res = await fetch("/api/auth/signout?all=true", {
        method: "POST",
        credentials: "include"
      });

      if (!res.ok) {
        await createSupabaseBrowserClient().auth.signOut();
      }
    } catch {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      setIsSigningOut(false);
    }

    window.location.replace("/");
  }

  if (isHomepage || isDashboard) {
    return null;
  }

  return (
    <header className="border-b oc-border oc-bg backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide oc-accent">
          OcupaLoc
        </Link>
        {isAuthPage ? null : session === null ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full oc-text border-oc-border bg-white hover:bg-oc-teal-soft">
              <Link href="/login">Intră în cont</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full border-0 oc-primary">
              <Link href="/signup?start=1">Creează cont</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border oc-border bg-oc-teal-soft text-xs font-semibold oc-accent">
              {initialsFromEmail(session.user.email)}
            </div>
            <span className="hidden text-sm oc-secondary-text sm:inline">{session.user.email ?? "utilizator"}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full oc-text border-oc-border bg-white hover:bg-oc-teal-soft"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Se iese..." : "Ieși din cont"}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
