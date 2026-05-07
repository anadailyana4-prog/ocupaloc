import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type EmailQueueItem = {
  id: string;
  template: string;
  to_email: string;
  subject: string;
  payload: Record<string, unknown>;
  status: "queued" | "processing" | "sent" | "failed";
  retry_count: number;
  next_retry_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

function resolveAdmin(admin?: SupabaseClient): SupabaseClient {
  return admin ?? createSupabaseServiceClient();
}

export async function enqueueEmail(
  input: {
    template: string;
    toEmail: string;
    subject: string;
    payload: Record<string, unknown>;
  },
  admin?: SupabaseClient
): Promise<void> {
  const db = resolveAdmin(admin);
  const { error } = await db.from("email_queue").insert({
    template: input.template,
    to_email: input.toEmail,
    subject: input.subject,
    payload: input.payload,
    status: "queued",
    retry_count: 0,
    next_retry_at: new Date().toISOString()
  });

  if (error) {
    throw new Error(`email_queue enqueue failed: ${error.message}`);
  }
}

export async function claimQueuedEmails(limit: number, admin?: SupabaseClient): Promise<EmailQueueItem[]> {
  const db = resolveAdmin(admin);
  const { data, error } = await db.rpc("claim_email_queue_items", { p_limit: limit });

  if (error) {
    throw new Error(`email_queue claim failed: ${error.message}`);
  }

  return (data as EmailQueueItem[] | null) ?? [];
}

export async function markEmailSent(id: string, admin?: SupabaseClient): Promise<void> {
  const db = resolveAdmin(admin);
  const { error } = await db
    .from("email_queue")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw new Error(`email_queue mark sent failed: ${error.message}`);
  }
}

function getBackoffMinutes(retryCount: number): number | null {
  if (retryCount === 1) return 5;
  if (retryCount === 2) return 15;
  if (retryCount === 3) return 60;
  return null;
}

export async function markEmailFailed(id: string, retryCount: number, errorMessage: string, admin?: SupabaseClient): Promise<void> {
  const db = resolveAdmin(admin);
  const nextRetryCount = retryCount + 1;
  const backoffMinutes = getBackoffMinutes(nextRetryCount);

  if (!backoffMinutes) {
    const { error } = await db
      .from("email_queue")
      .update({
        status: "failed",
        retry_count: nextRetryCount,
        last_error: errorMessage.slice(0, 1000),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(`email_queue mark final failed failed: ${error.message}`);
    }

    return;
  }

  const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
  const { error } = await db
    .from("email_queue")
    .update({
      status: "queued",
      retry_count: nextRetryCount,
      next_retry_at: nextRetry,
      last_error: errorMessage.slice(0, 1000),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw new Error(`email_queue requeue failed: ${error.message}`);
  }
}
