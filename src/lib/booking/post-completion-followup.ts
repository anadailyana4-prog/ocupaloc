import { notifyClientPostCompletion } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type FollowupSource = "salon_dashboard" | "cron";

export async function sendPostCompletionFollowup(programareId: string, source: FollowupSource): Promise<boolean> {
  const admin = createSupabaseServiceClient();

  const { data: booking, error: bookingErr } = await admin
    .from("programari")
    .select("id, profesionist_id")
    .eq("id", programareId)
    .maybeSingle();

  if (bookingErr || !booking?.id || !booking?.profesionist_id) {
    reportError("email", "post_completion_followup_booking_missing", bookingErr, { programareId, source });
    return false;
  }

  const { data: existing, error: existingErr } = await admin
    .from("programari_followups")
    .select("id")
    .eq("programare_id", programareId)
    .eq("tip", "review")
    .maybeSingle();

  if (existingErr) {
    reportError("email", "post_completion_followup_lookup_failed", existingErr, { programareId, source });
    return false;
  }

  if (existing?.id) {
    return false;
  }

  const sent = await notifyClientPostCompletion(programareId);
  if (!sent) {
    return false;
  }

  const { error: insErr } = await admin.from("programari_followups").insert({
    programare_id: programareId,
    profesionist_id: booking.profesionist_id,
    tip: "review",
    source
  });

  if (insErr) {
    const message = insErr.message?.toLowerCase() ?? "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return false;
    }
    reportError("email", "post_completion_followup_insert_failed", insErr, { programareId, source });
    return false;
  }

  return true;
}
