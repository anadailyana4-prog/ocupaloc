# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `docs/ENGINEERING_STANDARDS.md` — maintenance rules for production-safe changes
- `docs/adr/001-atomic-booking-rpc.md` — decision record for `book_appointment_atomic`
- `install.sh`, `pnpm run prepare:distribution`, `docs/DISTRIBUTION.md`
- `supabase/config.toml`, `supabase/MIGRATIONS.md`
- Unified test runners: `scripts/run-unit-tests.mjs` + Vitest for billing/owner/cron tests

### Changed

- Booking RPC migrations renumbered to `055`–`057` (no duplicate `036`/`037` versions)
- Middleware moved to `src/middleware.ts`
- Legacy `schema.sql` archived as `docs/archive/schema-d1-legacy.sql`
- Hosting docs: Vercel runtime + Cloudflare DNS-only (no Workers/Pages runtime)
- `verify:db` loads `.env.local` automatically

### Fixed

- Booking RPC: `p_billing_enabled` skips subscription gate when billing is off (prod)
- Booking RPC: overlap uses full `data_final` window; `reactivated` subscription status
- Legacy trial in RPC aligned to 14 days (`057`, matches `BILLING_TRIAL_DAYS`)
- Backup DB URL test no longer depends on fixed pooler IPv4
- Sentry `onRequestError` hook in `instrumentation.ts`
- `ws` dependency override (security advisory)

## [0.1.1] - 2026-05-29

Same as [Unreleased] above (repo hygiene + booking RPC production alignment).

## [0.1.0] - 2026-04-24

### Added

- **Multi-tenant booking platform** for Romanian beauty salons (frizerii, manichiură, gene, pensat, tatuaje, estetică)
- **Salon management dashboard** with service creation, schedule management, and booking administration
- **Public booking interface** with available time slot calculation and real-time availability
- **Client management** with booking history, reminders, and automatic confirmations
- **Authentication system** with email/password and OAuth (Google) via Supabase Auth
- **Rate limiting** using Supabase backend to prevent API abuse
- **Email notifications** via Resend for booking confirmations and reminders
- **Cron job system** for automated reminders and maintenance tasks
- **Contact management** with phone number normalization for Romanian phone numbers
- **CSV import** for bulk client data import
- **Service presets** with predefined durations and pricing structures
- **RLS policies** for multi-tenant data isolation and security
- **Synthetic monitoring** and SLO (Service Level Objective) tracking for production health
- **Operational alerts** and event logging for critical business flows
- **Booking confirmation links** with HMAC-based security for cancellation and confirmation
- **Stripe integration** with webhook handling for subscription management
- **Subscription billing system** with trial periods and grace periods for past-due payments
- **Admin-only capabilities** for salon creation, service management, and manual booking entry
- **Public salon pages** with slug-based URL routing and embedded booking widget
- **Schedule management** with weekly business hours configuration
- **Mobile-responsive design** using Tailwind CSS and shadcn/ui components
- **TypeScript** across the entire codebase for type safety
- **ESLint and Prettier** for code quality and formatting
- **Playwright E2E tests** with CI/CD integration for critical user flows
- **Unit tests** with Vitest for utility functions and business logic

### Technical Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Supabase (PostgreSQL with RLS policies)
- **Authentication**: Supabase Auth (email/password, Google OAuth)
- **Email**: Resend API
- **Payments**: Stripe (subscriptions and webhooks)
- **Monitoring**: Sentry (error tracking), custom synthetic monitors
- **Infrastructure**: Vercel (hosting), Cloudflare (DNS + email only)
- **Testing**: Playwright (E2E), Vitest (unit tests)

### Database

- **57 migrations** with sequential numbering (001–053, 055–057; see `supabase/MIGRATIONS.md`)
- Tables: users, profesionisti, programari, services, subscriptions, rate_limits, operational_events
- RLS policies for data isolation and security
- Indexes for performance optimization
- Foreign key constraints for data integrity

### Known Limitations

- Trial period grace window: 14 days (configurable)
- Rate limiting: 60 requests per minute per IP
- Email confirmations require Resend API configuration
- Stripe webhook registration requires manual configuration in Stripe Dashboard
- Google OAuth requires Supabase OAuth provider setup

### Security Considerations

- All passwords hashed via Supabase Auth
- Booking confirmation links use HMAC signatures
- RLS policies enforce data isolation between salon owners
- Service role key restricted to server-side operations
- API secrets required for cron jobs and webhooks
- No hardcoded credentials in source code

---

## Contributing

When making changes to the project, update this changelog:

1. Add a new section under the `[Unreleased]` heading (or create one if it doesn't exist)
2. Categorize your changes: Added, Changed, Deprecated, Removed, Fixed, Security
3. Use descriptive bullet points
4. Reference issue numbers when applicable (e.g., "Fix #123")
5. Update `package.json` version field when releasing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## Version History

- **0.1.1** (2026-05-29): Distribution hygiene, booking RPC fixes, migration renumbering
- **0.1.0** (2026-04-24): Initial MVP release with core booking, authentication, and billing features
