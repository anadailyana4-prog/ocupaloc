#!/usr/bin/env node
/**
 * Diagnostic Ocupaloc în Cloudflare (nu modifică nimic, nu atinge Scanmasa).
 * Necesită: export CLOUDFLARE_API_TOKEN="..." (API Token cu Account → Cloudflare Pages → Read minim)
 *
 * Rulează: npm run cf:repair-status
 */

const ACCOUNT_ID = "b72af520fe201c6dafe799eb638e66be";
const OCUPALOC_PROJECT = "ocupaloc";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error(
    "Lipsește CLOUDFLARE_API_TOKEN. Creează un token: dash.cloudflare.com → API Tokens (Pages: Read sau Edit)."
  );
  process.exit(1);
}
if (/[^\u0000-\u007f]/.test(token)) {
  console.error("Token invalid: nu folosi diacritice; copiază tokenul din dashboard.");
  process.exit(1);
}

const PLACEHOLDERS = new Set([
  "tokenul_generat",
  "your_token_here",
  "paste_real_token_here",
  "sirul_lung_fara_diacritice",
  "paste_from_dashboard"
]);
if (PLACEHOLDERS.has(token.toLowerCase()) || token.length < 30) {
  console.error(
    "CLOUDFLARE_API_TOKEN nu e tokenul real (e text din exemplu) sau e prea scurt.\n" +
      "În Cloudflare: Profil → API Tokens → Create Token → copiază șirul afișat o singură dată.\n" +
      "Nu copia cuvinte din tutorial; tokenul arată ca un cod aleatoriu lung."
  );
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

async function verifyToken() {
  const res = await fetch(
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
    { headers }
  );
  const data = await res.json();
  if (!data.success) {
    console.error("Token invalid:", JSON.stringify(data.errors));
    process.exit(1);
  }
}

async function listPagesProjects() {
  const out = [];
  let page = 1;
  for (;;) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects?page=${page}&per_page=50`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.success) {
      throw new Error(
        `List pages projects: ${JSON.stringify(data.errors ?? data)}`
      );
    }
    const batch = data.result ?? [];
    out.push(...batch);
    if (batch.length < 50) break;
    page += 1;
  }
  return out;
}

async function listProjectDomains(projectName) {
  const out = [];
  let page = 1;
  const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${projectName}`;
  for (;;) {
    const url = `${base}/domains?page=${page}&per_page=50`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.success) {
      throw new Error(
        `List domains: ${JSON.stringify(data.errors ?? data)}`
      );
    }
    const batch = data.result ?? [];
    out.push(...batch);
    if (batch.length < 50) break;
    page += 1;
  }
  return out;
}

async function main() {
  await verifyToken();
  console.log("Cont Cloudflare:", ACCOUNT_ID);
  console.log("---\n");

  const projects = await listPagesProjects();
  const names = projects.map((p) => p.name).sort();
  console.log(`Proiecte Pages în cont: ${projects.length}`);
  for (const n of names) {
    const mark = n === OCUPALOC_PROJECT ? " ← Ocupaloc" : "";
    console.log(`  • ${n}${mark}`);
  }

  const oc = projects.find((p) => p.name === OCUPALOC_PROJECT);
  console.log("\n---\nOcupaloc:\n");

  if (!oc) {
    console.log(
      `❌ Proiectul Pages „${OCUPALOC_PROJECT}” NU există.\n` +
        "Recreează și redeploy:\n" +
        "  npx wrangler pages project create ocupaloc\n" +
        "  npm run deploy:pages\n" +
        "Apoi în Pages → Settings → Environment variables: copiază din .env.example (Supabase, SITE_URL, etc.)."
    );
    return;
  }

  console.log("✅ Proiectul Pages există.");
  if (oc.subdomain) {
    console.log(`   URL *.pages.dev: https://${oc.subdomain}`);
  }
  if (oc.domains?.length) {
    console.log("   Domenii (din proiect):", oc.domains.join(", "));
  }

  let doms = [];
  try {
    doms = await listProjectDomains(OCUPALOC_PROJECT);
  } catch {
    console.log(
      "   (Nu s-au putut citi domeniile — token cu Pages: Read sau Edit.)"
    );
  }
  if (doms.length) {
    console.log("   Domenii custom (API):");
    for (const d of doms) {
      console.log(`     • ${d.name} [${d.status}]`);
    }
  }

  console.log("\n---\nPași manuali (dashboard), dacă ceva „nu merge”:\n");
  console.log(
    "1) Pages → ocupaloc → Settings → Variables: NEXT_PUBLIC_SUPABASE_*, NEXT_PUBLIC_SITE_URL=https://ocupaloc.ro, etc."
  );
  console.log(
    "2) DNS: apex + CNAME www proxied; vezi DEPLOY.md (www / redirect)."
  );
  console.log(
    "3) 403 pe www: Zero Trust Access sau WAF — tot în DEPLOY.md, nu din cod."
  );
  console.log("4) După schimbări: Caching → Purge Everything.");
  console.log("\nScanmasa nu e modificat de acest script.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
