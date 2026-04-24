import { formatInTimeZone } from "date-fns-tz";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TZ = "Europe/Bucharest";
const BILLING_TRIAL_DAYS = 30;

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(): Promise<Response> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return new Response("ADMIN_EMAIL not configured", { status: 503 });
  }

  const user = await getUser();
  if (!user || user.email !== adminEmail) {
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createSupabaseServiceClient();

  const { data: businesses } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at, onboarding_pas")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!businesses?.length) {
    const header = "Business,Slug,Email,Creat,Setup,Abonament,Expiră,Ultima programare,Prog. 30z,Calitate 30z,Sănătate,Viitoare 7z,Aşteptare 7z\n";
    return new Response(header, {
      status: 200,
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=\"ocupaloc-fleet.csv\"" },
    });
  }

  const profIds = businesses.map((b) => b.id);
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: subs }, { data: bookingStats }, { data: clientCancelStats }, { data: upcomingStats }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("profesionist_id, status, current_period_end")
      .in("profesionist_id", profIds)
      .order("created_at", { ascending: false }),
    admin
      .from("programari")
      .select("profesionist_id, data_start, status")
      .in("profesionist_id", profIds)
      .gte("data_start", thirtyDaysAgo)
      .limit(10000),
    admin
      .from("programari_status_events")
      .select("profesionist_id")
      .in("profesionist_id", profIds)
      .eq("status", "anulat")
      .eq("source", "client_link")
      .gte("created_at", thirtyDaysAgo),
    admin
      .from("programari")
      .select("profesionist_id, status")
      .in("profesionist_id", profIds)
      .in("status", ["confirmat", "in_asteptare"])
      .gte("data_start", now.toISOString())
      .lte("data_start", sevenDaysAhead),
  ]);

  // Build maps
  const subMap = new Map<string, { status: string; current_period_end: string | null }>();
  for (const s of subs ?? []) {
    if (!subMap.has(s.profesionist_id)) subMap.set(s.profesionist_id, s);
  }

  const lastBookingMap = new Map<string, string>();
  const bookings30dMap = new Map<string, number>();
  const noShowMap = new Map<string, number>();
  for (const b of bookingStats ?? []) {
    if (!lastBookingMap.has(b.profesionist_id)) lastBookingMap.set(b.profesionist_id, b.data_start);
    if (b.status === "confirmat" || b.status === "finalizat") {
      bookings30dMap.set(b.profesionist_id, (bookings30dMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "noaparit") {
      noShowMap.set(b.profesionist_id, (noShowMap.get(b.profesionist_id) ?? 0) + 1);
    }
  }
  const clientCancelMap = new Map<string, number>();
  for (const e of clientCancelStats ?? []) {
    const pid = e.profesionist_id as string;
    clientCancelMap.set(pid, (clientCancelMap.get(pid) ?? 0) + 1);
  }

  const upcomingConfirmedMap = new Map<string, number>();
  const pendingNextMap = new Map<string, number>();
  for (const b of upcomingStats ?? []) {
    const pid = b.profesionist_id as string;
    if (b.status === "confirmat") upcomingConfirmedMap.set(pid, (upcomingConfirmedMap.get(pid) ?? 0) + 1);
    else if (b.status === "in_asteptare") pendingNextMap.set(pid, (pendingNextMap.get(pid) ?? 0) + 1);
  }

  const rows = businesses.map((b) => {
    const createdAt = b.created_at ? new Date(b.created_at) : null;
    const trialEnd = createdAt ? new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
    const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
    const accountAgeDays = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;
    const subStatus = subMap.get(b.id)?.status ?? "trial";
    const onboardingDone = (b.onboarding_pas ?? 0) >= 4;
    const lastBookingIso = lastBookingMap.get(b.id) ?? null;
    const isQuiet14d = !lastBookingIso || lastBookingIso < fourteenDaysAgo;
    const isTrialExpired = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft < 0;
    const confirmed30d = bookings30dMap.get(b.id) ?? 0;
    const noShows30d = noShowMap.get(b.id) ?? 0;
    const cc30d = clientCancelMap.get(b.id) ?? 0;
    const qualityTotal = confirmed30d + noShows30d + cc30d;
    const confirmationRate30d = qualityTotal >= 5 ? Math.round((confirmed30d / qualityTotal) * 100) : null;
    const isTrialExpiringSoon = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft >= 0;

    const upcomingConfirmed7d = upcomingConfirmedMap.get(b.id) ?? 0;
    const pendingNext7d = pendingNextMap.get(b.id) ?? 0;
    const healthBand = (() => {
      if (!onboardingDone) return "critical";
      if (subStatus === "past_due" || subStatus === "canceled") return "critical";
      if (isTrialExpired) return "critical";
      if (isQuiet14d && accountAgeDays > 14) return upcomingConfirmed7d > 0 ? "watch" : "at_risk";
      if (confirmationRate30d !== null && confirmationRate30d < 60) return "at_risk";
      if (isTrialExpiringSoon) return "watch";
      if (confirmationRate30d !== null && confirmationRate30d < 80) return "watch";
      if (isQuiet14d) return "watch";
      return "healthy";
    })();

    return [
      b.nume_business?.trim() ?? "",
      b.slug ?? "",
      b.email_contact ?? "",
      createdAt ? formatInTimeZone(createdAt, TZ, "dd.MM.yyyy") : "",
      onboardingDone ? "complet" : "incomplet",
      subStatus,
      subMap.get(b.id)?.current_period_end
        ? formatInTimeZone(new Date(subMap.get(b.id)!.current_period_end!), TZ, "dd.MM.yyyy")
        : "",
      lastBookingIso ? formatInTimeZone(new Date(lastBookingIso), TZ, "dd.MM.yyyy") : "",
      confirmed30d,
      confirmationRate30d !== null ? `${confirmationRate30d}%` : "",
      healthBand,
      upcomingConfirmed7d,
      pendingNext7d,
    ].map(csvCell).join(",");
  });

  const header = "Business,Slug,Email,Creat,Setup,Abonament,Expiră,Ultima programare,Prog. 30z,Calitate 30z,Sănătate,Viitoare 7z,Aşteptare 7z";
  const csv = [header, ...rows].join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ocupaloc-fleet-${today}.csv"`,
    },
  });
}
