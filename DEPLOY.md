# Deploy Ownership (Production)

## Source of truth

- Production deploy ownership: **Vercel**
- Production branch: **GitHub `main`**
- Expected flow: commit pe `main` -> Vercel auto-deploy -> alias pe domeniul live

## Repository contract

- `vercel.json` nu trebuie să dezactiveze integrarea GitHub pentru deploy (`github.enabled: false` nu este permis pentru producție).
- Documentația de release trebuie să trateze Vercel ca țintă principală de producție.
- Fluxurile Cloudflare/OpenNext/Wrangler sunt opționale și nu definesc deploy-ul live principal.

## Manual verification in Vercel dashboard (required)

Urmează în ordine pașii din `DEPLOY_CHECKLIST.md`.
