import { reportError } from "@/lib/observability";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTrialWelcomeEmail(params: {
  email: string;
  numeBusiness: string;
  slug: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    console.warn("RESEND not configured - trial welcome email not sent");
    return;
  }

  const to = params.email.trim();
  if (!to) return;

  const name = escapeHtml(params.numeBusiness.trim() || "");
  const pageUrl = `${SITE_URL}/${params.slug}`;
  const dashboardUrl = `${SITE_URL}/dashboard`;

  const subject = "Trial-ul tău de 14 zile a început 🎉";

  const text = [
    `Bună${name ? `, ${params.numeBusiness}` : ""},`,
    "",
    "Mulțumim că ai ales să ni te alături! Perioada ta gratuită de 14 zile a început chiar acum.",
    "",
    "Ce poți face în continuare:",
    `• Personalizează-ți pagina publică: ${pageUrl}`,
    "• Configurează serviciile și programul de lucru",
    "• Trimite linkul clienților tăi și primești primele programări",
    "",
    "Abonamentul (59,99 RON/lună) pornește automat la sfârșitul celor 14 zile. Poți anula oricând din dashboard.",
    "",
    `Intră în dashboard: ${dashboardUrl}`,
    "",
    "Cu drag,",
    "Echipa OcupaLoc"
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- Header -->
        <tr>
          <td style="background:#1c1c2e;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fbbf24;letter-spacing:-0.5px;">OcupaLoc</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
              Bun venit${name ? `, ${name}` : ""}! 🎉
            </h1>
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              Mulțumim că ai ales să ni te alături. Perioada ta gratuită de <strong>14 zile</strong> a început chiar acum — explorează tot ce OcupaLoc îți pune la dispoziție.
            </p>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0;margin:0 0 24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-weight:700;color:#111827;font-size:14px;">Pași recomandați:</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;color:#374151;font-size:14px;">
                      <span style="display:inline-block;width:22px;height:22px;background:#1c1c2e;color:#fbbf24;border-radius:50%;font-size:12px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">1</span>
                      Personalizează serviciile și programul de lucru
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#374151;font-size:14px;">
                      <span style="display:inline-block;width:22px;height:22px;background:#1c1c2e;color:#fbbf24;border-radius:50%;font-size:12px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">2</span>
                      Trimite linkul tău clienților pe WhatsApp
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#374151;font-size:14px;">
                      <span style="display:inline-block;width:22px;height:22px;background:#1c1c2e;color:#fbbf24;border-radius:50%;font-size:12px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">3</span>
                      Primești primele programări online 🚀
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <a href="${dashboardUrl}" style="display:inline-block;background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:700;font-size:15px;margin-bottom:24px;">
              Deschide dashboard-ul →
            </a>

            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;line-height:1.5;">
              Abonamentul (59,99 RON/lună) pornește automat după cele 14 zile. Poți anula oricând din dashboard, fără penalizări.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              OcupaLoc · <a href="${SITE_URL}" style="color:#9ca3af;">${SITE_URL.replace("https://", "")}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to: [to], subject, text, html })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      reportError("email", "trial_welcome_resend_error", new Error(`Resend ${res.status}: ${body}`), { email: to });
    }
  } catch (e) {
    reportError("email", "trial_welcome_email_failed", e instanceof Error ? e : new Error(String(e)), { email: to });
  }
}
