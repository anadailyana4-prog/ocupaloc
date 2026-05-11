import { readFileSync } from "node:fs";
import { basename } from "node:path";

// Load .env.local then .env manually (no dotenv dependency)
for (const envFile of [".env.local", ".env"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // file not present — skip
  }
}

type LeadRow = Record<string, string>;

type Lead = {
  title: string;
  city: string;
  website: string;
  phone: string;
  score: number;
  reviews: number;
  category: string;
};

type SendResult = {
  lead: Lead;
  websiteDomain: string;
  email: string;
  subject: string;
  status: "sent" | "dry-run" | "failed";
  error?: string;
};

const BLOCKED_WEBSITE_HOSTS = new Set([
  "fresha.com",
  "www.fresha.com",
  "mero.ro",
  "www.mero.ro",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "google.com",
  "www.google.com"
]);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function parseArgs() {
  const args = process.argv.slice(2);
  const csvPath = args.find((arg) => !arg.startsWith("--"));
  const send = args.includes("--send");

  const maxArg = args.find((arg) => arg.startsWith("--max="));
  const max = maxArg ? Number(maxArg.split("=")[1]) : 15;

  const delayArg = args.find((arg) => arg.startsWith("--delayMs="));
  const delayMs = delayArg ? Number(delayArg.split("=")[1]) : 1200;

  if (!csvPath) {
    throw new Error("Missing CSV path. Usage: tsx scripts/send-leads-campaign.ts <csvPath> [--send] [--max=15] [--delayMs=1200]");
  }

  return { csvPath, send, max: Number.isFinite(max) ? max : 15, delayMs: Number.isFinite(delayMs) ? delayMs : 1200 };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current);
  return out.map((v) => v.trim());
}

function parseCsv(content: string): LeadRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: LeadRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    return row;
  });
}

function asLead(row: LeadRow): Lead {
  return {
    title: row.title?.trim() ?? "",
    city: row.city?.trim() ?? "",
    website: row.website?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    score: Number(row.totalScore ?? "0") || 0,
    reviews: Number(row.reviewsCount ?? "0") || 0,
    category: row.categoryName?.trim() ?? ""
  };
}

function normalizeHost(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeEmail(candidate: string): string {
  return candidate.replace(/[),.;:]$/, "").trim().toLowerCase();
}

function isLikelyPersonalOrBusinessEmail(email: string): boolean {
  if (email.endsWith("@example.com")) return false;
  if (email.includes("noreply")) return false;
  if (email.includes("no-reply")) return false;
  if (/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(email)) return false;
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return false;
  if (!/[a-z]/i.test(localPart)) return false;
  if (!/[a-z]/i.test(domainPart)) return false;
  if (/^\d+\./.test(domainPart)) return false;
  return true;
}

async function findEmailFromWebsite(website: string): Promise<string | null> {
  if (!website) return null;

  const candidates = new Set<string>();
  const base = website.startsWith("http") ? website : `https://${website}`;
  const host = normalizeHost(base);
  if (!host || BLOCKED_WEBSITE_HOSTS.has(host)) return null;

  const urlsToTry = [base, `${base.replace(/\/$/, "")}/contact`, `${base.replace(/\/$/, "")}/contact-us`];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; LeadCampaignBot/1.0; +https://ocupaloc.ro)"
        }
      });

      if (!res.ok) continue;
      const body = await res.text();
      const matches = body.match(EMAIL_REGEX) ?? [];
      for (const raw of matches) {
        const email = sanitizeEmail(raw);
        if (isLikelyPersonalOrBusinessEmail(email)) {
          candidates.add(email);
        }
      }
      if (candidates.size > 0) {
        return [...candidates][0];
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildSubject(lead: Lead): string {
  return `Idee rapida pentru ${lead.title} (${lead.city || "Bucuresti"})`;
}

function buildTextBody(lead: Lead): string {
  const greetingName = lead.title;
  return [
    `Salut, echipa ${greetingName},`,
    "",
    "Am observat profilul vostru si m-am gandit sa va scriu direct, pe scurt.",
    "",
    "Ajutam barbershop-uri sa transforme programarile din telefon/DM intr-un flux simplu online (rezervare, confirmare, reminder), fara sa schimbe stilul de lucru.",
    "",
    "Daca vreti, va pot trimite un mini plan personalizat (3 pasi) pentru cum ati putea creste programarile confirmate si reduce no-show-urile.",
    "",
    "Dureaza 5 minute sa vedem daca are sens pentru voi.",
    "",
    "Cu respect,",
    "Echipa OcupaLoc",
    "https://ocupaloc.ro"
  ].join("\n");
}

function buildHtmlBody(lead: Lead): string {
  const escapedTitle = lead.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <p>Salut, echipa <strong>${escapedTitle}</strong>,</p>
  <p>Am observat profilul vostru si m-am gandit sa va scriu direct, pe scurt.</p>
  <p>Ajutam barbershop-uri sa transforme programarile din telefon/DM intr-un flux simplu online (rezervare, confirmare, reminder), fara sa schimbe stilul de lucru.</p>
  <p>Daca vreti, va pot trimite un mini plan personalizat (3 pasi) pentru cum ati putea creste programarile confirmate si reduce no-show-urile.</p>
  <p>Dureaza 5 minute sa vedem daca are sens pentru voi.</p>
  <p>Cu respect,<br/>Echipa OcupaLoc<br/><a href="https://ocupaloc.ro">ocupaloc.ro</a></p>
  `.trim();
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM in environment.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function scoreLead(lead: Lead): number {
  let score = 0;
  if (lead.score >= 4.7) score += 25;
  if (lead.reviews >= 150) score += 25;
  if (lead.website) score += 20;
  if (lead.phone) score += 15;
  if (lead.category.toLowerCase().includes("frizer")) score += 15;
  return score;
}

async function main() {
  const { csvPath, send, max, delayMs } = parseArgs();
  const csvContent = readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvContent);

  const leads = rows
    .map(asLead)
    .filter((lead) => lead.title && lead.category.toLowerCase().includes("frizer"))
    .filter((lead) => lead.website || lead.phone)
    .sort((a, b) => scoreLead(b) - scoreLead(a))
    .slice(0, max);

  const results: SendResult[] = [];

  for (const lead of leads) {
    const host = normalizeHost(lead.website);
    if (!lead.website || !host || BLOCKED_WEBSITE_HOSTS.has(host)) {
      continue;
    }

    const email = await findEmailFromWebsite(lead.website);
    if (!email) {
      continue;
    }

    const subject = buildSubject(lead);
    const text = buildTextBody(lead);
    const html = buildHtmlBody(lead);

    if (!send) {
      results.push({
        lead,
        websiteDomain: host,
        email,
        subject,
        status: "dry-run"
      });
      continue;
    }

    try {
      await sendResendEmail({ to: email, subject, text, html });
      results.push({
        lead,
        websiteDomain: host,
        email,
        subject,
        status: "sent"
      });
      await sleep(delayMs);
    } catch (error) {
      results.push({
        lead,
        websiteDomain: host,
        email,
        subject,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const dry = results.filter((r) => r.status === "dry-run").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n=== Lead campaign ${send ? "SEND" : "DRY-RUN"} ===`);
  console.log(`Source file: ${basename(csvPath)}`);
  console.log(`Candidates processed: ${leads.length}`);
  console.log(`Found deliverable emails: ${results.length}`);
  console.log(`Sent: ${sent} | Dry-run: ${dry} | Failed: ${failed}`);

  if (results.length > 0) {
    console.log("\nDetails:");
    for (const result of results) {
      console.log(`- [${result.status}] ${result.lead.title} -> ${result.email} | ${result.subject}${result.error ? ` | ${result.error}` : ""}`);
    }
  }
}

main().catch((error) => {
  console.error("Lead campaign failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
