"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setSubmitError(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    setBusy(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    toast.success("Autentificare reușită.");
    trackAuthEvent("login_success", "password");
    router.push("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`
      }
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    }
  }

  async function signInWithMagicLink() {
    const email = form.getValues("email").trim();
    if (!email) {
      toast.error("Introdu emailul pentru link-ul magic.");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    setBusy(false);

    if (!response.ok) {
      toast.error(payload?.message ?? "Nu am putut trimite linkul acum.");
      return;
    }

    trackAuthEvent("magic_link_sent", "email_link");
    toast.success(payload?.message ?? "Dacă emailul există, am trimis linkul.");
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

    trackAuthEvent("password_reset_sent", "email_reset");
    toast.success(payload?.message ?? "Dacă emailul există, am trimis instrucțiunile.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Autentificare</CardTitle>
          <CardDescription>Intră în contul Ocupaloc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                      <Input data-testid="login-password-input" type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button data-testid="login-submit" type="submit" className="w-full" disabled={busy}>
                {busy ? "Se autentifică…" : "Continuă"}
              </Button>
              {submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-muted-foreground">sau</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => void signInWithGoogle()} disabled={busy}>
            Continuă cu Google
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => void signInWithMagicLink()} disabled={busy}>
            Intră cu link pe email
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => void sendPasswordReset()}
            disabled={busy}
          >
            Ai uitat parola?
          </button>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-800 pt-4">
          <p className="text-sm text-muted-foreground">
            Nu ai cont?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Creează unul
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
