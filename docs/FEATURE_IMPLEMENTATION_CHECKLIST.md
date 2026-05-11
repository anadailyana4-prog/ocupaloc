# Feature Implementation Checklist

Use this checklist for every new feature or major change.

## 1) Scope

- Feature name:
- Owner area (A-Z letter):
- User impact:
- Production impact: yes/no

## 2) Design

- API changes (if any):
- Data model/migration changes (if any):
- UI changes (if any):
- Rollback plan:

## 3) Implementation

- [ ] Implement smallest vertical slice
- [ ] Add/update tests in `tests`
- [ ] Update docs impacted by behavior change

## 4) Validation

- [ ] `pnpm run check:local`
- [ ] `pnpm run verify:secrets` (if production-impacting)
- [ ] `pnpm run verify:db` (if DB-impacting)
- [ ] `pnpm run verify:billing` (if billing-impacting)
- [ ] `pnpm run ops:synthetic` (if runtime-impacting)
- [ ] `pnpm run ops:slo` (if release-impacting)

## 5) Release

- [ ] Link PR to changed docs
- [ ] Confirm deployment target and envs
- [ ] Execute post-deploy checks

## 6) Post-release

- [ ] Monitor logs and health indicators
- [ ] Capture lessons learned into docs if needed