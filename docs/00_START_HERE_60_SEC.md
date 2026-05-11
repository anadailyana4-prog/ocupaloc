# Start Here in 60 Seconds

Use this when you want the fastest safe path.

1. Open `docs/A_TO_Z_MASTER_INDEX.md` and pick the system area letter.
2. Change code only in that owner area first.
3. Run:

```bash
pnpm run check:local
```

4. If production-impacting, run:

```bash
pnpm run verify:secrets
pnpm run verify:db
pnpm run verify:billing
pnpm run ops:synthetic
pnpm run ops:slo
```

5. Follow release/ops docs only if needed:
- `RELEASE_RUNBOOK.md`
- `RUNBOOK.md`
- `DEPLOY_CHECKLIST.md`

Rule: if a change is hard to place, update the A-Z index before coding.