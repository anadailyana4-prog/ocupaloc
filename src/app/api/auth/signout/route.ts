import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export const runtime = "edge";

export async function POST(request: NextRequest) {
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
