"use client";

import { useEffect, useMemo, useState } from "react";

import { getAuthBridgeAction, getErrorMessage, getSafeNext } from "@/lib/supabase/auth-bridge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isIgnorableSignupLinkError(error: unknown) {
  const raw = getErrorMessage(error).toLowerCase();
  return (
    raw.includes("invalid") ||
    raw.includes("expired") ||
    raw.includes("already") ||
    raw.includes("otp") ||
    raw.includes("token") ||
    raw.includes("pkce") ||
    raw.includes("verifier") ||
    raw.includes("storage")
  );
}

export default function AuthBridgePage() {
  const [message, setMessage] = useState("Finalizăm autentificarea...");

  const safeNext = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    return getSafeNext(new URL(window.location.href).searchParams.get("next"));
  }, []);

  const isSignupConfirmation = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URL(window.location.href).searchParams.get("signup") === "1";
  }, []);

  const isRecoveryFlow = useMemo(() => {
    if (typeof window === "undefined") return false;
    const current = new URL(window.location.href);
    return current.searchParams.get("type") === "recovery";
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
          // Recovery tokens are handled in reset-password page, not here
          if (action.otpType === "recovery") {
            const resetUrl = new URL("/reset-password", window.location.origin);
            resetUrl.searchParams.set("token_hash", action.tokenHash);
            resetUrl.searchParams.set("type", "recovery");
            if (!cancelled) window.location.replace(resetUrl.toString());
            return;
          }

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

        // Recovery links should send user to set a new password.
        if (isRecoveryFlow) {
          if (!cancelled) window.location.replace("/reset-password");
          return;
        }

        // Signup confirmation should only verify email and then send user to login.
        // Do not enforce an authenticated session in this branch.
        if (isSignupConfirmation) {
          setMessage("Email confirmat. Redirecționăm către autentificare...");
          if (!cancelled) window.location.replace("/login?signup=confirmat");
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
        if (isSignupConfirmation && isIgnorableSignupLinkError(error)) {
          // Reused/expired signup links are common after the first successful click.
          // Treat them as confirmation-complete to avoid trapping users in an auth-error loop.
          if (!cancelled) window.location.replace("/login?signup=confirmat");
          return;
        }

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
  }, [safeNext, isSignupConfirmation, isRecoveryFlow]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
