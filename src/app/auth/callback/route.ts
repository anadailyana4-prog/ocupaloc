import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sendWelcomeEmail } from "@/lib/email/welcome-user";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/login?error=config", site));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.includes("://") ? next : "/dashboard";

  if (code) {
    const response = NextResponse.redirect(new URL(safeNext, request.url));
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => response.cookies.set(name, value, options));
        }
      }
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const emailConfirmed = Boolean(user?.email_confirmed_at);
      const alreadySent = Boolean((user?.user_metadata as { welcome_email_sent?: boolean } | undefined)?.welcome_email_sent);
      if (user?.email && emailConfirmed && !alreadySent) {
        await sendWelcomeEmail(user.email, user.user_metadata?.full_name ?? "");
        await supabase.auth.updateUser({
          data: {
            ...(user.user_metadata ?? {}),
            welcome_email_sent: true
          }
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", site));
}
