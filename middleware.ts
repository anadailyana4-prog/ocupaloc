import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";

type CookieToSet = { name: string; value: string; options: CookieOptions };
type ProfProfile = {
  nume_business?: string | null;
  telefon?: string | null;
  tip_activitate?: string | null;
  onboarding_pas?: number | null;
};

function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

async function isProfileComplete(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data: profile, telefonColumnAvailable } = await selectWithTelefonFallback<ProfProfile>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", userId).maybeSingle(),
    "nume_business, telefon, tip_activitate, onboarding_pas",
    "nume_business, tip_activitate, onboarding_pas"
  );
  return Boolean(
    profile?.nume_business?.trim() &&
      profile?.tip_activitate?.trim() &&
      (!telefonColumnAvailable || profile?.telefon?.trim()) &&
      (profile?.onboarding_pas ?? 0) >= 4
  );
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
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const hasSession = user != null;
  const userId = user?.id;

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
    // Cache rapid în cookie: evit\u0103m un DB query la fiecare request protejat.
    // Cookie-ul _prof_ok=1 este valid 5 minute (max-age 300). Cacheaz\u0103 doar starea
    // "profil complet" — starea "incomplet" nu se cache\u0103z\u0103 niciodat\u0103.
    const cachedComplete = request.cookies.get("_prof_ok")?.value === "1";

    let complete = cachedComplete;
    if (!complete) {
      complete = await isProfileComplete(supabase, userId);
    }

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

    // Seteaz\u0103 cookie-ul de cache dac\u0103 profilul e complet \u015fi cookie-ul lipse\u015fte sau e pe cale s\u0103 expire.
    if (complete && !cachedComplete) {
      supabaseResponse.cookies.set("_prof_ok", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 300 // 5 minute
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/signup"]
};
