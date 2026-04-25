import { reportError } from "@/lib/observability";

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

  const subject = "Bun venit pe OcupaLoc!";
  const text = [
    `Salut ${displayName},`,
    "",
    "Mulțumim că ți-ai creat cont pe OcupaLoc.",
    `Intră în dashboard ca să-ți configurezi pagina și serviciile: ${dashboardUrl}`,
    "",
    "Pași următori:",
    "1. Completează profilul și adaugă serviciile",
    "2. Setează programul de lucru",
    "3. Copiază linkul tău și trimite-l clienților",
    "",
    "Spor la programări!",
    "Echipa OcupaLoc"
  ].join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Bun venit pe OcupaLoc, ${displayName}! 👋</h2>
  <p style="margin:0 0 16px;color:#6b7280;">Contul tău e gata. Urmează 3 pași simpli pentru a primi primele programări online.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 8px;font-weight:700;">Pași următori:</p>
    <ol style="margin:0;padding-left:20px;">
      <li style="margin-bottom:6px;">Completează profilul și adaugă serviciile</li>
      <li style="margin-bottom:6px;">Setează programul de lucru</li>
      <li>Copiază linkul tău și trimite-l clienților pe WhatsApp</li>
    </ol>
  </div>

  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Deschide dashboard-ul →</a>

  <p style="margin:0;color:#9ca3af;font-size:12px;">OcupaLoc · <a href="${siteUrl}" style="color:#9ca3af;">ocupaloc.ro</a></p>
</div>`;

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
        text,
        html
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      reportError("email", "welcome_email_resend_error", new Error(`Resend ${res.status}: ${body}`), { email: to });
    }
  } catch (e) {
    reportError("email", "welcome_email_failed", e instanceof Error ? e : new Error(String(e)), { email: to });
  }
}
