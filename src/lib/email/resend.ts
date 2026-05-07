import { env } from "@/lib/config/env";

export async function sendResendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  event: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const apiKey = env.get("RESEND_API_KEY");
  const from = env.get("RESEND_FROM");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body || input.event}`);
  }
}
