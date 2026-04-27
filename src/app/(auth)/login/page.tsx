"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
      setSubmitError(error.message);
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
    window.location.replace("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Autentificare</CardTitle>
          <CardDescription>Intră în contul OcupaLoc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signupConfirmed && (
            <div className="rounded-md border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm text-emerald-300">
              ✓ Contul dumneavoastră a fost creat cu succes! Vă puteți autentifica acum.
            </div>
          )}
          {alreadyLoggedIn && (
            <div className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
              Ești deja autentificat.{" "}
              <Link href="/dashboard" className="font-medium text-white underline underline-offset-2">
                Du-te la dashboard →
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
                          className="absolute right-1 top-1 h-8 px-2 text-zinc-400 hover:text-zinc-100"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                        >
                          {showPassword ? "👁" : "🙈"}
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
              {authError === "auth" && decodedAuthReason ? (
                <p className="text-sm text-amber-300">Autentificarea anterioară a eșuat: {decodedAuthReason}</p>
              ) : null}
              {submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}
            </form>
          </Form>
          <button
            type="button"
            className="w-full text-center text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => void sendPasswordReset()}
            disabled={busy}
          >
            Ai uitat parola?
          </button>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <p className="text-sm text-muted-foreground">
            Nu ai cont?{" "}
            <Link href="/signup?start=1" className="text-primary underline-offset-4 hover:underline">
              Creează unul
            </Link>
          </p>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Înapoi la pagina principală
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
