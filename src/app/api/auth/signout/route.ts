import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { reportError } from "@/lib/observability";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function normalizedOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedSignoutRequest(request: NextRequest): boolean {
  const siteOrigin = normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const requestOrigin = request.nextUrl.origin;
  const allowedOrigins = new Set<string>([requestOrigin]);
  if (siteOrigin) {
    allowedOrigins.add(siteOrigin);
    if (siteOrigin.startsWith("https://www.")) {
      allowedOrigins.add(siteOrigin.replace("https://www.", "https://"));
    } else if (siteOrigin.startsWith("https://")) {
      allowedOrigins.add(siteOrigin.replace("https://", "https://www."));
    }
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const incomingOrigin = normalizedOrigin(originHeader ?? "") ?? normalizedOrigin(refererHeader ?? "");

  return incomingOrigin ? allowedOrigins.has(incomingOrigin) : false;
}

export async function POST(request: NextRequest) {
  if (!isAllowedSignoutRequest(request)) {
    reportError("auth", "signout_csrf_rejected", "Invalid origin", {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer")
    });
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 500 });
  }

  const all = request.nextUrl.searchParams.get("all") === "true";
  const scope = all ? "global" : "local";

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.signOut({ scope });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return response;
}
