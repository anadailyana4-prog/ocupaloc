import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function DemoPage() {
  async function loginDemo() {
    "use server";

    const email = process.env[`DEMO${"_EMAIL"}`];
    const password = process.env[`DEMO${"_PASSWORD"}`];
    if (!email || !password) {
      redirect("/login?error=demo_config_missing");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      redirect("/login?error=demo_login_failed");
    }

    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <form action={loginDemo} className="w-full max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
        <h1 className="text-xl font-semibold">Acces demo</h1>
        <p className="text-sm text-zinc-400">Autentificarea demo se face securizat, doar din variabile de mediu server-side.</p>
        <Button data-testid="demo-login-submit" type="submit" className="w-full">
          Intră în demo
        </Button>
      </form>
    </div>
  );
}
