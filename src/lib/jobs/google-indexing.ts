import { JWT } from "google-auth-library";

type SitemapEntry = {
  url: string;
  lastmod?: string;
  lastmodTs: number;
};

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

const LEGAL_PATHS = new Set(["/termeni", "/confidentialitate", "/cookies", "/gdpr"]);

function parseIsoDate(value?: string): number {
  if (!value) {
    return 0;
  }
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

function sanitizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const pattern = /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g;
  let match: RegExpExecArray | null;

  // Regex parsing is enough here because we only need <loc> and optional <lastmod>.
  while ((match = pattern.exec(xml)) !== null) {
    const url = match[1]?.trim();
    if (!url) {
      continue;
    }
    const lastmod = match[2]?.trim();
    entries.push({
      url,
      lastmod,
      lastmodTs: parseIsoDate(lastmod)
    });
  }

  return entries;
}

function scoreUrl(rawUrl: string): number {
  let score = 0;

  try {
    const path = new URL(rawUrl).pathname;

    if (LEGAL_PATHS.has(path)) {
      return -100;
    }

    if (path === "/" || path === "/preturi") {
      score += 80;
    }

    if (/^\/(bucuresti|cluj-napoca|timisoara|iasi|constanta|brasov|sibiu|oradea)(\/|$)/.test(path)) {
      score += 70;
    }

    if (/\/(programari-online|software-programari|aplicatie-programari|alternativa|comparativ)\b/.test(path)) {
      score += 60;
    }

    if (path.startsWith("/blog/")) {
      score += 40;
    }

    if (path === "/demo-interactiv" || path === "/demo-salon" || path === "/suport") {
      score -= 25;
    }
  } catch {
    return -100;
  }

  return score;
}

function pickDailyCandidates(entries: SitemapEntry[], limit: number): SitemapEntry[] {
  return [...entries]
    .filter((entry) => entry.url.startsWith("http"))
    .sort((a, b) => {
      const scoreDiff = scoreUrl(b.url) - scoreUrl(a.url);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return b.lastmodTs - a.lastmodTs;
    })
    .slice(0, limit);
}

function getRequiredIndexingConfig() {
  const rawEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.trim();

  if (!rawEmail || !rawPrivateKey) {
    throw new Error("Missing GOOGLE_INDEXING_CLIENT_EMAIL or GOOGLE_INDEXING_PRIVATE_KEY");
  }

  return {
    clientEmail: rawEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n")
  };
}

async function getAccessToken(): Promise<string> {
  const { clientEmail, privateKey } = getRequiredIndexingConfig();
  const client = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [INDEXING_SCOPE]
  });

  const tokens = await client.authorize();
  const accessToken = tokens.access_token?.trim();

  if (!accessToken) {
    throw new Error("Failed to obtain Google Indexing API access token");
  }

  return accessToken;
}

export async function runGoogleIndexingDailyJob() {
  const baseUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ocupaloc.ro");
  const sitemapUrl = process.env.GOOGLE_INDEXING_SITEMAP_URL?.trim() || `${baseUrl}/sitemap.xml`;

  const limitFromEnv = Number(process.env.GOOGLE_INDEXING_DAILY_LIMIT?.trim() || "12");
  const dailyLimit = Number.isFinite(limitFromEnv) ? Math.min(Math.max(limitFromEnv, 1), 100) : 12;

  const sitemapResponse = await fetch(sitemapUrl, {
    method: "GET",
    headers: { Accept: "application/xml,text/xml" },
    cache: "no-store"
  });

  if (!sitemapResponse.ok) {
    throw new Error(`Failed to load sitemap: ${sitemapResponse.status}`);
  }

  const xml = await sitemapResponse.text();
  const entries = parseSitemap(xml);
  const candidates = pickDailyCandidates(entries, dailyLimit);
  const accessToken = await getAccessToken();

  let submitted = 0;
  const failed: Array<{ url: string; status: number; body: string }> = [];

  for (const entry of candidates) {
    const response = await fetch(INDEXING_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: entry.url,
        type: "URL_UPDATED"
      })
    });

    if (response.ok) {
      submitted += 1;
      continue;
    }

    const body = await response.text();
    failed.push({
      url: entry.url,
      status: response.status,
      body: body.slice(0, 500)
    });
  }

  return {
    sitemapUrl,
    discovered: entries.length,
    attempted: candidates.length,
    submitted,
    failed: failed.length,
    failedUrls: failed,
    selectedUrls: candidates.map((entry) => entry.url)
  };
}