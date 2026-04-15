import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

async function isProfileComplete(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase.from("profiles").select("full_name, phone, role").eq("id", userId).maybeSingle();
  return Boolean(profile?.full_name?.trim() && profile?.phone?.trim() && profile?.role?.trim());
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;
  const hasSession = session != null;
  const userId = session?.user?.id;

  if ((path.startsWith("/dashboard") || path === "/onboarding") && !hasSession) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    copyAuthCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (hasSession && (path === "/login" || path === "/signup")) {
    const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
    copyAuthCookies(supabaseResponse, redirect);
    return redirect;
  }

  // Onboarding gate: session fără profil complet stă pe /onboarding, altfel merge în /dashboard.
  if (hasSession && userId) {
    const complete = await isProfileComplete(supabase, userId);
    if (!complete && path !== "/onboarding") {
      const redirect = NextResponse.redirect(new URL("/onboarding", request.url));
      copyAuthCookies(supabaseResponse, redirect);
      return redirect;
    }
    if (complete && path === "/onboarding") {
      const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
      copyAuthCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/signup"]
};
