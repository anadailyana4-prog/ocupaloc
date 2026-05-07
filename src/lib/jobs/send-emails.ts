import type { SupabaseClient } from "@supabase/supabase-js";

import { claimQueuedEmails, markEmailFailed, markEmailSent } from "@/lib/email/email-queue";
import { sendResendEmail } from "@/lib/email/resend";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";

export type SendEmailsResult = {
  claimed: number;
  sent: number;
  retried: number;
  failedFinal: number;
};

type EmailSender = typeof sendResendEmail;

type JobDeps = {
  admin?: SupabaseClient;
  emailSender?: EmailSender;
};

export async function runSendEmailsJob(limit: number, deps: JobDeps = {}): Promise<SendEmailsResult> {
  const startedAt = Date.now();
  const emailSender = deps.emailSender ?? sendResendEmail;
  const claimed = await claimQueuedEmails(limit, deps.admin);

  const result: SendEmailsResult = {
    claimed: claimed.length,
    sent: 0,
    retried: 0,
    failedFinal: 0
  };

  for (const item of claimed) {
    try {
      const payload = item.payload as { text?: unknown; html?: unknown };
      const text = typeof payload.text === "string" ? payload.text : "";
      const html = typeof payload.html === "string" ? payload.html : undefined;

      if (!text && !html) {
        throw new Error("Missing email content payload");
      }

      await emailSender({
        to: [item.to_email],
        subject: item.subject,
        text,
        html,
        event: `send_email_template_${item.template}`
      });

      await markEmailSent(item.id, deps.admin);
      result.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markEmailFailed(item.id, item.retry_count, message, deps.admin);

      if (item.retry_count + 1 > 3) {
        result.failedFinal += 1;
      } else {
        result.retried += 1;
      }

      reportError("email", "send_emails_job_item_failed", error, {
        queueId: item.id,
        template: item.template,
        toEmail: item.to_email,
        retryCount: item.retry_count + 1
      });
    }
  }

  await recordOperationalEvent({
    eventType: "email.send.processed",
    flow: "email",
    outcome: "success",
    latencyMs: Date.now() - startedAt,
    metadata: result
  });

  return result;
}
