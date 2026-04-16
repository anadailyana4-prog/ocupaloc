#!/usr/bin/env node
/**
 * Removes all custom domains from the Cloudflare Pages project "ocupaloc",
 * then deletes the project. Does not touch any other project (e.g. scanmasa).
 *
 * Prerequisites:
 * 1. Create an API Token: My Profile → API Tokens → Create Token
 *    - Use template "Edit Cloudflare Workers" OR custom with:
 *      Account → Cloudflare Pages → Edit
 * 2. Create a token (long random string). NOT the words "your_token_here" or
 *    "tokenul_generat" — replace with the value Cloudflare shows once.
 * 3. In terminal, paste ONLY the token string from the dashboard (ASCII letters,
 *    digits, dashes — no Romanian diacritics, no instructional text):
 *    export CLOUDFLARE_API_TOKEN="<paste-from-dashboard>"
 * 4. Run: node scripts/delete-pages-project-ocupaloc.mjs
 *
 * Token permissions: Account → Cloudflare Pages → Edit (required for this script).
 */

const ACCOUNT_ID = "b72af520fe201c6dafe799eb638e66be";
const PROJECT_NAME = "ocupaloc";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error(
    "Missing CLOUDFLARE_API_TOKEN. See comments at top of this script."
  );
  process.exit(1);
}

const PLACEHOLDERS = new Set([
  "tokenul_generat",
  "your_token_here",
  "paste_real_token_here",
  "sirul_lung_fara_diacritice",
  "paste_from_dashboard"
]);
if (token.length < 30 || PLACEHOLDERS.has(token.toLowerCase())) {
  console.error(
    "CLOUDFLARE_API_TOKEN pare a fi placeholder sau prea scurt.\n" +
      "Generează un token real: https://dash.cloudflare.com/profile/api-tokens\n" +
      "Lipește valoarea afișată o singură dată (de obicei zeci de caractere)."
  );
  process.exit(1);
}

// HTTP headers must be Latin-1 / ASCII; Romanian diacritics in a fake "token" crash fetch().
if (/[^\u0000-\u007f]/.test(token)) {
  console.error(
    "Tokenul conține caractere non-ASCII (ex. ș, î, ă). Asta NU e tokenul Cloudflare.\n" +
      "Copiază din dashboard șirul afișat la Create Token (doar litere/cifre), nu textul din tutorial.\n" +
      "https://dash.cloudflare.com/profile/api-tokens"
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`;

/** Quick check that the API token is valid (official verify endpoint). */
async function verifyToken() {
  const url = "https://api.cloudflare.com/client/v4/user/tokens/verify";
  const res = await fetch(url, { method: "GET", headers });
  const data = await res.json();
  if (!data.success) {
    const err = data.errors?.[0];
    const code = err?.code;
    const hint =
      code === 9106 || code === 1000
        ? "\n→ Generează un API Token nou: dash.cloudflare.com → Profil → API Tokens → Create Token.\n" +
          "→ Nu folosi textul „tokenul_generat”; lipește șirul lung afișat o dată.\n" +
          "→ Folosește „API Token”, nu „Global API Key” în acest script.\n" +
          "→ Permisiuni pentru acest script: Account → Cloudflare Pages → Edit."
        : "";
    throw new Error(
      `Verificare token eșuată: ${JSON.stringify(data.errors ?? data)}${hint}`
    );
  }
}

async function listAllDomains() {
  const out = [];
  let page = 1;
  const perPage = 50;
  for (;;) {
    const url = `${base}/domains?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.success) {
      throw new Error(
        `List domains failed: ${JSON.stringify(data.errors ?? data)}`
      );
    }
    const batch = data.result ?? [];
    out.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return out;
}

async function deleteDomain(domainName) {
  const url = `${base}/domains/${encodeURIComponent(domainName)}`;
  const res = await fetch(url, { method: "DELETE", headers });
  const data = await res.json();
  if (!data.success) {
    throw new Error(
      `DELETE domain ${domainName}: ${JSON.stringify(data.errors ?? data)}`
    );
  }
  return data;
}

async function deleteProject() {
  const res = await fetch(base, { method: "DELETE", headers });
  const data = await res.json();
  if (!data.success) {
    throw new Error(
      `DELETE project: ${JSON.stringify(data.errors ?? data)}`
    );
  }
  return data;
}

async function main() {
  console.log(`Project: ${PROJECT_NAME} (account ${ACCOUNT_ID})`);
  process.stdout.write("Verificare token ... ");
  await verifyToken();
  console.log("ok");
  const domains = await listAllDomains();
  console.log(`Found ${domains.length} custom domain(s).`);
  for (const d of domains) {
    const name = d.name;
    process.stdout.write(`Removing domain: ${name} ... `);
    await deleteDomain(name);
    console.log("ok");
  }
  process.stdout.write("Deleting project ... ");
  await deleteProject();
  console.log("ok");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
