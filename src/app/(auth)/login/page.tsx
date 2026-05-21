"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trackAuthEvent } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators/auth";
import { toast } from "sonner";

async function reportAuthOutcome(outcome: "success" | "failure", reason?: string) {
  await fetch("/api/ops/auth-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome, reason }),
    keepalive: true
  }).catch(() => {
    // Telemetry is best-effort and must never block login UX.
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const authReason = searchParams.get("reason");
  const authError = searchParams.get("error");
  const decodedAuthReason = authReason ? decodeURIComponent(authReason) : null;
  const signupConfirmed = searchParams.get("signup") === "confirmat";

  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAlreadyLoggedIn(true);
      }
    });
  }, []);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setSubmitError(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (error) {
      setBusy(false);
      // Debug logging to help diagnose login issues
      console.error("[login] Supabase auth error:", {
        message: error.message,
        status: (error as { status?: number }).status,
        code: (error as { code?: string }).code
      });
      const errorLower = error.message.toLowerCase();
      const isUnconfirmed = 
        errorLower.includes("email not confirmed") || 
        errorLower.includes("user not confirmed") ||
        errorLower.includes("not confirmed");
      setSubmitError(
        isUnconfirmed
          ? "Trebuie să confirmi emailul înainte de a te autentifica. Verifică inbox-ul și folderul Spam."
          : "Email sau parolă invalidă."
      );
      void reportAuthOutcome("failure", error.message);
      return;
    }

    // Supabase can persist the session cookies slightly after the auth response.
    // Give the browser a brief window to flush them before the first protected navigation.
    if (!data.session) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session) {
          break;
        }

        await wait(200);
      }
    } else {
      await wait(1200);
    }

    setBusy(false);
    toast.success("Autentificare reușită.");
    trackAuthEvent("login_success", "password");
    void reportAuthOutcome("success");
    const nextUrl = searchParams.get("next");
    const safeNext = nextUrl && nextUrl.startsWith("/") ? nextUrl : "/dashboard";
    window.location.href = safeNext;
  }

  async function sendPasswordReset() {
    const email = form.getValues("email").trim();
    if (!email) {
      toast.error("Introdu emailul pentru resetarea parolei.");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    setBusy(false);

    if (!response.ok) {
      toast.error(payload?.message ?? "Nu am putut procesa cererea acum.");
      return;
    }

    // The API route sends the email server-side (no PKCE), so nothing more to do here.
    trackAuthEvent("password_reset_sent", "email_reset");
    toast.success(payload?.message ?? "Dacă emailul există, am trimis instrucțiunile.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 oc-bg oc-text">
      <Card className="w-full max-w-md border oc-border oc-bg">
        <CardHeader>
          <CardTitle className="oc-text">Autentificare</CardTitle>
          <CardDescription className="oc-secondary-text">Intră în contul OcupaLoc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signupConfirmed && (
            <div className="rounded-md border border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✓ Contul dumneavoastră a fost creat cu succes! Vă puteți autentifica acum.
            </div>
          )}
          {alreadyLoggedIn && (
            <div className="rounded-md border oc-border oc-badge-bg px-4 py-3 text-sm oc-text">
              Ești deja autentificat.{" "}
              <Link href="/dashboard" className="font-medium oc-accent underline underline-offset-2">
                Du-te la meniu →
              </Link>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input data-testid="login-email-input" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolă</FormLabel>
                    <button
                      type="button"
                      className="mb-2 w-full text-left text-sm text-primary underline-offset-4 hover:underline"
                      onClick={() => void sendPasswordReset()}
                      disabled={busy}
                    >
                      Ai uitat parola?
                    </button>
                    <FormControl>
                      <div className="relative">
                        <Input
                          data-testid="login-password-input"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pr-12"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 px-2 oc-secondary-text hover:oc-text"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button data-testid="login-submit" type="submit" className="w-full h-12 text-base font-bold" disabled={busy}>
                {busy ? "Se autentifică…" : "Continuă"}
              </Button>
              {authError === "auth" && decodedAuthReason && !signupConfirmed ? (
                <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
                  <p className="font-medium">Problemă la confirmare</p>
                  <p className="text-xs mt-1">Încearcă să te autentifici mai jos sau contactează suportul dacă problema persistă.</p>
                </div>
              ) : null}
              {submitError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <p className="font-medium">{submitError}</p>
                  {submitError.includes("confirmi emailul") && (
                    <p className="mt-1 text-xs text-red-600">
                      Probleme? Contactează-ne la suport@ocupaloc.ro cu adresa ta de email.
                    </p>
                  )}
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t oc-border pt-4">
          <p className="text-sm oc-secondary-text">
            Nu ai cont?{" "}
            <Link href="/signup?start=1" className="oc-accent underline-offset-4 hover:underline">
              Creează unul
            </Link>
          </p>
          <Link href="/" className="text-sm oc-secondary-text underline-offset-4 hover:underline">
            ← Înapoi la pagina principală
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
