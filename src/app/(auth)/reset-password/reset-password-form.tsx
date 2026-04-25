"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function verifyRecoveryToken() {
      // If token_hash and type are in URL, verify them first
      if (tokenHash && type === "recovery") {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery"
          });

          if (verifyError) {
            setError("Link invalid sau expirat. " + verifyError.message);
            setSessionChecked(true);
            return;
          }

          // Give session a moment to persist
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (_err) {
          setError("A apărut o eroare la verificarea linkului.");
          setSessionChecked(true);
          return;
        }
      }

      // Check if we have a valid session (recovery or regular)
      const { data } = await supabase.auth.getSession();
      setHasRecoverySession(Boolean(data.session));
      setSessionChecked(true);
    }

    void verifyRecoveryToken();
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Parola trebuie să aibă minim 8 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Parolele nu coincid.");
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Parola a fost actualizată.");
    window.location.replace("/dashboard");
  }

  if (!sessionChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Verificăm linkul de resetare...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Eroare la resetare</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="text-sm text-primary underline underline-offset-4">
              Înapoi la autentificare
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!hasRecoverySession) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle>Link invalid sau expirat</CardTitle>
            <CardDescription>Cere un nou email de resetare din pagina de autentificare.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="text-sm text-primary underline underline-offset-4">
              Înapoi la autentificare
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Setează parola nouă</CardTitle>
          <CardDescription>Introdu noua parolă pentru contul tău.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-password">
                Parolă nouă
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-12"
                  required
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm-password">
                Confirmă parola nouă
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 px-2 text-zinc-400 hover:text-zinc-100"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showConfirmPassword ? "👁" : "🙈"}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Se actualizează..." : "Actualizează parola"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-zinc-100">
            Înapoi la autentificare
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
