import dns from "dns";
import { promisify } from "util";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const resolveTxt = promisify(dns.resolveTxt);

export interface DnsCheckResult {
  found: boolean;
  value: string | null;
  error?: string;
}

async function checkTxtRecord(name: string, matcher: (record: string) => boolean): Promise<DnsCheckResult> {
  try {
    const records = await resolveTxt(name);
    const flat = records.map((chunks) => chunks.join(""));
    const match = flat.find(matcher);
    return { found: Boolean(match), value: match ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENODATA") || message.includes("ENOTFOUND")) {
      return { found: false, value: null };
    }
    return { found: false, value: null, error: message };
  }
}

export async function checkSpf(domain: string): Promise<DnsCheckResult> {
  return checkTxtRecord(domain, (r) => r.startsWith("v=spf1"));
}

export async function checkDkim(selector: string, domain: string): Promise<DnsCheckResult> {
  return checkTxtRecord(`${selector}._domainkey.${domain}`, (r) => r.includes("v=DKIM1") || r.includes("k=rsa") || r.includes("p="));
}

export async function checkDmarc(domain: string): Promise<DnsCheckResult> {
  return checkTxtRecord(`_dmarc.${domain}`, (r) => r.startsWith("v=DMARC1"));
}

function extractDomain(emailOrDomain: string): string {
  const trimmed = emailOrDomain.trim();
  if (trimmed.includes("@")) {
    return trimmed.split("@")[1].toLowerCase();
  }
  return trimmed.toLowerCase();
}

export interface BounceMetrics {
  total: number;
  bounced: number;
  bounceRate: number;
  last7DaysTotal: number;
  last7DaysBounced: number;
  last7DaysBounceRate: number;
}

export async function getBounceMetrics(): Promise<BounceMetrics> {
  const admin = createSupabaseServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allResult, last7Result] = await Promise.all([
    admin.from("outreach_messages").select("status").in("status", ["sent", "bounced", "replied", "opened"]),
    admin.from("outreach_messages").select("status").in("status", ["sent", "bounced", "replied", "opened"]).gte("sent_at", sevenDaysAgo)
  ]);

  function countMessages(rows: Array<{ status: string }> | null) {
    let total = 0;
    let bounced = 0;
    for (const row of rows ?? []) {
      total++;
      if (row.status === "bounced") bounced++;
    }
    return { total, bounced };
  }

  const all = countMessages(allResult.data as Array<{ status: string }> | null);
  const last7 = countMessages(last7Result.data as Array<{ status: string }> | null);

  return {
    total: all.total,
    bounced: all.bounced,
    bounceRate: all.total > 0 ? all.bounced / all.total : 0,
    last7DaysTotal: last7.total,
    last7DaysBounced: last7.bounced,
    last7DaysBounceRate: last7.total > 0 ? last7.bounced / last7.total : 0
  };
}

function volumeRecommendation(bounceRate: number, dnsOk: boolean): string {
  if (!dnsOk) {
    return "⛔ STOP — remedieaza SPF/DKIM/DMARC inainte de orice trimitere";
  }
  if (bounceRate > 0.1) {
    return "🚨 Bounce rate critic (>10%) — opreste si curata lista imediat";
  }
  if (bounceRate > 0.05) {
    return "⚠️ Bounce rate ridicat (>5%) — max 20/zi pana scade sub 3%";
  }
  if (bounceRate > 0.02) {
    return "🟡 Bounce rate moderat (>2%) — max 30/zi, monitorizeaza zilnic";
  }
  return "✅ Bounce rate sanatos (<2%) — poti trimite pana la 50/zi";
}

export interface DeliverabilityReport {
  domain: string;
  spf: DnsCheckResult;
  dkim: DnsCheckResult;
  dmarc: DnsCheckResult;
  bounceMetrics: BounceMetrics;
  recommendation: string;
  formattedText: string;
}

export async function getDeliverabilityReport(): Promise<DeliverabilityReport> {
  const fromEnv = process.env.OUTREACH_FROM_EMAIL ?? process.env.OUTREACH_IMAP_USER ?? "";
  const domain = fromEnv ? extractDomain(fromEnv) : "domain-neconfigurat.ro";

  // Try common DKIM selectors used by popular ESP/mail servers
  const dkimSelectors = ["mail", "default", "google", "selector1", "selector2", "smtp", "mta"];
  let dkim: DnsCheckResult = { found: false, value: null };
  for (const sel of dkimSelectors) {
    const result = await checkDkim(sel, domain);
    if (result.found) {
      dkim = result;
      break;
    }
  }

  const [spf, dmarc, bounceMetrics] = await Promise.all([
    checkSpf(domain),
    checkDmarc(domain),
    getBounceMetrics()
  ]);

  const dnsOk = spf.found && dkim.found && dmarc.found;
  const recommendation = volumeRecommendation(bounceMetrics.last7DaysBounceRate, dnsOk);

  const spfLine = spf.found ? `✅ SPF: ${spf.value?.substring(0, 60)}` : `❌ SPF: lipsa${spf.error ? ` (${spf.error})` : ""}`;
  const dkimLine = dkim.found ? `✅ DKIM: inregistrare detectata` : `❌ DKIM: nicio selectie cunoscuta gasita`;
  const dmarcLine = dmarc.found ? `✅ DMARC: ${dmarc.value?.substring(0, 60)}` : `❌ DMARC: lipsa${dmarc.error ? ` (${dmarc.error})` : ""}`;

  const last7RatePct = (bounceMetrics.last7DaysBounceRate * 100).toFixed(1);
  const totalRatePct = (bounceMetrics.bounceRate * 100).toFixed(1);

  const formattedText = [
    `📬 DELIVERABILITY HEALTH`,
    `Domeniu: ${domain}`,
    "",
    spfLine,
    dkimLine,
    dmarcLine,
    "",
    `📊 Bounce rate (7 zile): ${last7RatePct}% (${bounceMetrics.last7DaysBounced}/${bounceMetrics.last7DaysTotal})`,
    `📊 Bounce rate (total): ${totalRatePct}% (${bounceMetrics.bounced}/${bounceMetrics.total})`,
    "",
    recommendation
  ].join("\n");

  return { domain, spf, dkim, dmarc, bounceMetrics, recommendation, formattedText };
}
