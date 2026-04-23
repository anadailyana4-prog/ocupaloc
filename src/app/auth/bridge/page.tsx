"use client";

import { useEffect, useMemo, useState } from "react";

import { getAuthBridgeAction, getErrorMessage, getSafeNext } from "@/lib/supabase/auth-bridge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const action = getAuthBridgeAction(current);

      try {
        if (action.kind === "code") {
          const { error } = await supabase.auth.exchangeCodeForSession(action.code);
          if (error) throw error;
        } else if (action.kind === "otp") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: action.tokenHash,
            type: action.otpType
          });
          if (error) throw error;
        } else if (action.kind === "session") {
          const { error } = await supabase.auth.setSession({
            access_token: action.accessToken,
            refresh_token: action.refreshToken
          });
          if (error) throw error;
        } else {
          // kind=none: no auth params present — check if already has a session
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            if (!cancelled) window.location.replace(safeNext);
            return;
          }
          const current = new URL(window.location.href);
          const oauthError = current.searchParams.get("error");
          const oauthDesc = current.searchParams.get("error_description");
          if (oauthError) {
            const reason = encodeURIComponent(oauthDesc ?? oauthError);
            if (!cancelled) window.location.replace(`/login?error=auth&reason=${reason}`);
            return;
          }
          if (!cancelled) window.location.replace("/login?error=auth&reason=sesiune_lipsa");
          return;
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
