export async function sendWelcomeEmail(email: string, nume: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY lipsă - emailul nu a fost trimis");
    return;
  }

  const to = email.trim();
  if (!to) return;

  const from = process.env.RESEND_FROM;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const dashboardUrl = `${siteUrl}/dashboard`;
  const displayName = nume.trim() || "prietene";

  const subject = "Bun venit pe Ocuploc!";
  const text = [
    `Salut ${displayName},`,
    "",
    "Mulțumim că ți-ai creat cont pe Ocuploc.",
    `Intră în dashboard ca să-ți configurezi pagina și serviciile: ${dashboardUrl}`,
    "",
    "Spor la programări!",
    "Echipa Ocuploc"
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[sendWelcomeEmail] Resend", res.status, body);
    }
  } catch (e) {
    console.error("[sendWelcomeEmail]", e);
  }
}
