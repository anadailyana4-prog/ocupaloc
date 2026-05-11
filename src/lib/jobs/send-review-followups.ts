import { subDays, subHours } from "date-fns";

import { sendPostCompletionFollowup } from "@/lib/booking/post-completion-followup";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type ReviewFollowupJobResult = {
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
};

export async function runSendReviewFollowupsJob(limit = 300): Promise<ReviewFollowupJobResult> {
  const admin = createSupabaseServiceClient();
  const to = subHours(new Date(), 2);
  const from = subDays(to, 7);

  const { data: rows, error } = await admin
    .from("programari")
    .select("id, data_final, profesionisti(google_review_url)")
    .eq("status", "finalizat")
    .not("email_client", "is", null)
    .gte("data_final", from.toISOString())
    .lte("data_final", to.toISOString())
    .order("data_final", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`send-review-followups query failed: ${error.message}`);
  }

  if (!rows?.length) {
    return { scanned: 0, sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const relProf = row.profesionisti as { google_review_url?: string | null } | { google_review_url?: string | null }[] | null;
    const prof = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
    const reviewUrl = prof?.google_review_url?.trim();

    if (!reviewUrl) {
      skipped += 1;
      continue;
    }

    try {
      const ok = await sendPostCompletionFollowup(row.id, "cron");
      if (ok) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      reportError("cron", "send_review_followup_failed", error, { programareId: row.id });
    }
  }

  return { scanned: rows.length, sent, skipped, failed };
}
