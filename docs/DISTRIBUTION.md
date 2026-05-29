# Distribution checklist

## Safe to share

- Git repository (only `.env.example` is tracked)
- Run `./install.sh` on a clean machine

## Never include in ZIP / public archive

- `.env.local`, `.env.prod.local`, `.env.production.local`
- `.env.vercel.*` (except if empty template)

Verify before zipping:

```bash
pnpm run prepare:distribution
```

## Secrets rotation

If a full working-directory ZIP was ever shared, rotate:

- Supabase service role + anon (if exposed)
- Stripe keys and webhook secret
- Resend, Telegram, cron secrets, `OWNER_INIT_SECRET`
