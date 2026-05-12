import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function inferReplyEventType(input: { subject: string | null; body: string | null }) {
  const haystack = `${input.subject ?? ""} ${input.body ?? ""}`.toLowerCase();
  if (haystack.includes("unsubscribe") || haystack.includes("dezabon") || haystack.includes("stop")) {
    return "opt_out" as const;
  }
  if (haystack.includes("bounce") || haystack.includes("undeliver") || haystack.includes("mail delivery")) {
    return "bounce" as const;
  }
  if (haystack.includes("demo") || haystack.includes("call") || haystack.includes("sunati") || haystack.includes("programa")) {
    return "booking_intent" as const;
  }
  if (haystack.includes("interes") || haystack.includes("da") || haystack.includes("trimite")) {
    return "positive_reply" as const;
  }
  return "reply" as const;
}

function buildSuggestedDraft(eventType: string) {
  switch (eventType) {
    case "opt_out":
      return "Multumim. Confirmam ca oprim imediat orice contactare viitoare pentru acest business.";
    case "booking_intent":
      return "Multumim pentru raspuns. Putem trimite azi un exemplu scurt si, daca are sens, stabilim apoi o discutie de 10 minute.";
    case "positive_reply":
      return "Multumim. Trimit imediat un exemplu foarte scurt, aplicat pe fluxul vostru de programari.";
    default:
      return "Multumim pentru raspuns. Spune-ne ce te intereseaza cel mai mult si revenim punctual.";
  }
}

export async function syncLegacyRepliesToEvents(limit = 20) {
  const admin = createSupabaseServiceClient();
  const repliesResult = await admin
    .from("outreach_replies")
    .select("id, lead_id, from_email, subject, text_body, received_at")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (repliesResult.error) {
    throw repliesResult.error;
  }

  let inserted = 0;

  for (const row of repliesResult.data ?? []) {
    const reply = row as {
      id: string;
      lead_id: string | null;
      from_email: string;
      subject: string | null;
      text_body: string | null;
      received_at: string;
    };

    const existing = await admin
      .from("reply_events")
      .select("id")
      .eq("legacy_outreach_reply_id", reply.id)
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) continue;

    let leadId: string | null = null;
    if (reply.lead_id) {
      const leadResult = await admin.from("leads").select("id").eq("legacy_outreach_lead_id", reply.lead_id).limit(1).maybeSingle();
      if (leadResult.error) throw leadResult.error;
      leadId = (leadResult.data as { id: string } | null)?.id ?? null;
    }

    if (!leadId) {
      const contactResult = await admin
        .from("lead_contacts")
        .select("lead_id")
        .eq("channel", "email")
        .eq("normalized_value", reply.from_email.toLowerCase())
        .limit(1)
        .maybeSingle();
      if (contactResult.error) throw contactResult.error;
      leadId = (contactResult.data as { lead_id: string } | null)?.lead_id ?? null;
    }

    const eventType = inferReplyEventType({ subject: reply.subject, body: reply.text_body });
    const insert = await admin.from("reply_events").insert({
      lead_id: leadId,
      legacy_outreach_reply_id: reply.id,
      event_type: eventType,
      from_value: reply.from_email,
      subject: reply.subject,
      summary: reply.text_body?.slice(0, 600) ?? null,
      suggested_draft: buildSuggestedDraft(eventType),
      occurred_at: reply.received_at
    });

    if (insert.error) {
      throw insert.error;
    }

    if (eventType === "opt_out") {
      const suppressionInsert = await admin.from("suppression_list").upsert(
        {
          normalized_value: reply.from_email.toLowerCase(),
          channel: "email",
          reason: "Opt-out primit prin reply email",
          source: "reply_sync",
          lead_id: leadId
        },
        { onConflict: "normalized_value" }
      );
      if (suppressionInsert.error) {
        throw suppressionInsert.error;
      }
    }

    if (leadId) {
      const updateLead = await admin
        .from("leads")
        .update({
          qualification_status: eventType === "opt_out" ? "suppressed" : "replied",
          last_replied_at: reply.received_at,
          updated_at: new Date().toISOString()
        })
        .eq("id", leadId);
      if (updateLead.error) throw updateLead.error;
    }

    inserted += 1;
  }

  return { inserted };
}

export async function listRecentReplyEvents(limit = 5) {
  await syncLegacyRepliesToEvents(limit * 2);
  const admin = createSupabaseServiceClient();
  const result = await admin
    .from("reply_events")
    .select("id, event_type, from_value, summary, suggested_draft, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw result.error;
  }

  return result.data ?? [];
}