import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";

import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

const TZ = "Europe/Bucharest";
const MAX_ROWS = 5000;

function csvRow(fields: string[]): string {
  return (
    fields
      .map((f) => {
        const str = String(f ?? "");
        // Quote fields that contain commas, quotes, or newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replaceAll('"', '""')}"`;
        }
        return str;
      })
      .join(",") + "\r\n"
  );
}

export async function GET() {
  // Auth: must be a logged-in profesionist
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { data: prof } = await supabase
    .from("profesionisti")
    .select("id, slug, nume_business")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof?.id) {
    return NextResponse.json({ error: "Profil negăsit" }, { status: 404 });
  }

  const admin = createSupabaseServiceClient();

  // Rate limit: max 20 exports per hour per user
  const { allowed } = await checkApiRateLimit(admin, `export:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Prea multe cereri. Încearcă din nou mai târziu." }, { status: 429 });
  }

  const { data: rows, error } = await admin
    .from("programari")
    .select("id, data_start, data_final, status, nume_client, email_client, telefon_client, servicii(nume)")
    .eq("profesionist_id", prof.id)
    .order("data_start", { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    return NextResponse.json({ error: "Eroare la citirea datelor" }, { status: 500 });
  }

  const header = csvRow(["ID", "Data", "Ora start", "Ora final", "Status", "Client", "Email client", "Telefon client", "Serviciu"]);

  const body = (rows ?? [])
    .map((r) => {
      const relServ = r.servicii;
      const serviceName = Array.isArray(relServ) ? (relServ[0] as { nume?: string } | undefined)?.nume ?? "" : (relServ as { nume?: string } | null)?.nume ?? "";
      const start = new Date(r.data_start);
      const end = new Date(r.data_final);
      return csvRow([
        r.id,
        formatInTimeZone(start, TZ, "dd.MM.yyyy"),
        formatInTimeZone(start, TZ, "HH:mm"),
        formatInTimeZone(end, TZ, "HH:mm"),
        r.status,
        r.nume_client ?? "",
        r.email_client ?? "",
        r.telefon_client ?? "",
        serviceName
      ]);
    })
    .join("");

  const csv = header + body;
  const slug = prof.slug ?? "business";
  const filename = `programari-${slug}-${formatInTimeZone(new Date(), TZ, "yyyy-MM-dd")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
