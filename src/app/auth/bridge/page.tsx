"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSafeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  return raw;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "auth_bridge_failed";
}

export default function AuthBridgePage() {
  const [message, setMessage] = useState("Finalizăm autentificarea...");

  const safeNext = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    return getSafeNext(new URL(window.location.href).searchParams.get("next"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const supabase = createSupabaseBrowserClient();
      const current = new URL(window.location.href);
      const hashParams = new URLSearchParams(current.hash.startsWith("#") ? current.hash.slice(1) : current.hash);
      const code = current.searchParams.get("code");
      const tokenHash = current.searchParams.get("token_hash") ?? hashParams.get("token_hash");
      const otpType = (current.searchParams.get("type") ?? hashParams.get("type")) as EmailOtpType | null;
      const accessToken = hashParams.get("access_token") ?? current.searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") ?? current.searchParams.get("refresh_token");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType
          });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
        }

        let sessionFound = false;
        for (let i = 0; i < 8; i += 1) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session) {
            sessionFound = true;
            break;
          }
          await wait(150);
        }

        if (!sessionFound) {
          setMessage("Nu am putut finaliza autentificarea. Redirecționăm către login...");
          if (!cancelled) window.location.replace("/login?error=auth");
          return;
        }

        setMessage("Autentificare reușită. Redirecționăm...");
        if (!cancelled) window.location.replace(safeNext);
      } catch (error) {
        const reason = encodeURIComponent(getErrorMessage(error));
        console.error("[auth/bridge] finalize auth failed:", error);
        setMessage("Nu am putut finaliza autentificarea. Redirecționăm către login...");
        if (!cancelled) window.location.replace(`/login?error=auth&reason=${reason}`);
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [safeNext]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
