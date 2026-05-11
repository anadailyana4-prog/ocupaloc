# Owner Admin Portal - Plan Detaliat

## 1. AUDIT DATELOR EXISTENTE

### Tabele core:
- `profesionisti` — businesses (cu user_id, slug, created_at)
- `servicii` — services per business
- `programari` — bookings (status, data_start, created_at)
- `clienti_blocati` — blocked clients
- `subscriptions` — Stripe subs (status, period_end)
- `memberships` — multi-tenant memberships
- `idempotencykeys` — request dedup
- `operational_events` — cron/job tracking
- `auth.users` — Supabase auth

### KPIs calculabile ACUM:
✓ Total conturi create (COUNT profesionisti)
✓ Trial vs paid (JOIN cu subscriptions, check status)
✓ Active subscriptions (status = active)
✓ Cancelled (status = cancelled)
✓ MRR estimat (SUM price WHERE active)
✓ Programări totale (COUNT programari)
✓ Programări recent (WHERE created_at > NOW() - INTERVAL)
✓ Conturi inactive (last booking < 30 days)
✓ Locații (COUNT DISTINCT profesionisti)

### KPIs care trebuie INSTRUMENTATI:
⊘ Ultimă activitate per business (add: last_activity_at)
⊘ Emailuri trimise (add: email_audit table sau soft via logs)
⊘ Cron job results (add: cron_job_runs table)
⊘ User session/login tracking (add: owner_audit_logs table)
⊘ Owner notes (add: owner_notes table)
⊘ Business health markers (add: fields sau soft via joins)

---

## 2. DB CHANGES NECESARE

### Noi tabele:

#### A. `owner_admin_users` (owner/admin role tracking)
```sql
CREATE TABLE public.owner_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- 'owner', 'admin', 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

#### B. `owner_notes` (internal CRM notes)
```sql
CREATE TABLE public.owner_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesionist_id uuid NOT NULL REFERENCES public.profesionisti(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}', -- ['hot_lead', 'churn_risk', 'vip', 'needs_help']
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### C. `owner_audit_logs` (admin access tracking)
```sql
CREATE TABLE public.owner_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'view_business', 'edit_note', 'cancel_sub'
  resource_type TEXT, -- 'business', 'subscription', etc
  resource_id uuid,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### D. `business_activity_events` (track what businesses do)
```sql
CREATE TABLE public.business_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesionist_id uuid NOT NULL REFERENCES public.profesionisti(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'booking_created', 'onboarding_step', 'service_added'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### E. `cron_job_runs` (track cron executions)
```sql
CREATE TABLE public.cron_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  duration_ms INT,
  error_message TEXT,
  items_processed INT DEFAULT 0,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Noi koloane (migrations):
- `profesionisti.last_activity_at` TIMESTAMPTZ
- `profesionisti.onboarding_completed_at` TIMESTAMPTZ
- `profesionisti.first_booking_at` TIMESTAMPTZ

### RLS policies pentru owner portal:
- owner_admin_users: readonly pentru logged owner user
- owner_notes: accessible only by owner admin users
- owner_audit_logs: accessible only by owner admin users
- business_activity_events: accessible by owner (global query)
- cron_job_runs: accessible by owner (global query)

---

## 3. AUTH STRATEGY

### Custom claims dalam Supabase:
```json
{
  "role": "owner",
  "is_admin": true
}
```

### First admin setup (SECURE):
1. Deploy aplicație fără admin
2. Cron job care citeşte env var `INITIAL_OWNER_EMAIL`
3. Dacă nu există owner în `owner_admin_users`, creează-l

Alternative mai bună:
1. Query endpoint special (token-secured): `/api/owner/init?token=OWNER_INIT_TOKEN`
2. Verifica token din env
3. Creează owner dacă nu există
4. Token expiră imediat după

### Guards:
- Middleware pe /owner/* routes
- Verifica: user logged in + owner role în custom claims
- Dacă nu, redirect la /owner/login
- Server-side RLS enforcement

---

## 4. ROUTES STRUCTURE

```
/owner/                    — home redirect
/owner/login               — login page
/owner/logout              — logout handler

/owner/dashboard           — overview + KPIs
/owner/businesses          — list all + filters
/owner/businesses/[id]     — detail page
/owner/subscriptions       — billing view
/owner/trials              — expiring trials
/owner/activity            — events + analytics
/owner/errors              — incidents + issues
/owner/operations          — cron jobs, monitor
/owner/settings            — owner settings

/api/owner/stats           — KPIs endpoint
/api/owner/businesses      — list + pagination
/api/owner/business/[id]   — detail endpoint
/api/owner/notes           — CRUD notes
/api/owner/audit           — audit logs
/api/owner/init            — first admin setup
```

---

## 5. COMPONENTS STRUCTURE

```
src/app/(owner)/
├── layout.tsx              — owner layout + nav
├── dashboard/
│   ├── page.tsx            — overview
│   └── kpi-card.tsx
├── businesses/
│   ├── page.tsx            — list + filters
│   ├── [id]/
│   │   └── page.tsx        — detail
│   └── business-table.tsx
├── subscriptions/
│   └── page.tsx
├── activity/
│   └── page.tsx
├── errors/
│   └── page.tsx
├── operations/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── login/
    └── page.tsx

src/components/owner/
├── nav-sidebar.tsx
├── kpi-grid.tsx
├── business-table.tsx
├── filter-controls.tsx
├── notes-section.tsx
└── activity-timeline.tsx

src/lib/owner/
├── auth.ts                 — owner auth helpers
├── stats.ts                — KPI queries
├── business.ts             — business queries
├── notes.ts                — notes CRUD
└── audit.ts                — audit logging
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1: DB & Auth [2h]
- [ ] Migrații
- [ ] RLS policies
- [ ] Custom claims setup
- [ ] Init endpoint

### Phase 2: Core queries & server actions [1.5h]
- [ ] Stats queries (KPIs)
- [ ] Business list/detail queries
- [ ] Notes CRUD
- [ ] Audit logging

### Phase 3: Layout & Navigation [1h]
- [ ] Owner layout + sidebar
- [ ] Basic styling (dark mode if possible)
- [ ] Navigation structure

### Phase 4: Dashboard overview [1h]
- [ ] KPI cards
- [ ] Charts if time (minimal)
- [ ] Quick stats

### Phase 5: Businesses page [1.5h]
- [ ] List + table
- [ ] Filters + search
- [ ] Pagination
- [ ] Detail page

### Phase 6: Other sections [1.5h]
- [ ] Subscriptions
- [ ] Activity
- [ ] Errors
- [ ] Operations

### Phase 7: Settings & refinement [0.5h]
- [ ] Settings page
- [ ] Styling polish
- [ ] Mobile responsive basics

### Phase 8: Testing & deploy [0.5h]
- [ ] Security checks
- [ ] Init verification
- [ ] Production deploy

---

## 7. FIRST OWNER SETUP (POST-DEPLOY)

1. Deploy code
2. Run migration
3. Curl init endpoint:
   ```bash
   curl -X POST https://ocupaloc.ro/api/owner/init \
     -H "Authorization: Bearer YOUR_INIT_TOKEN" \
     -d '{"email": "your@email.com"}'
   ```
   Where `YOUR_INIT_TOKEN` is in env `OWNER_INIT_SECRET`
4. Go to /owner/login
5. Login with Supabase (email you provided)
6. Check custom claims → should have `role: owner`
7. Dashboard accessible

---

## 8. SECURITY CHECKLIST

- ✓ No hardcoded creds
- ✓ RLS on all tables
- ✓ Server-side auth checks
- ✓ Init token expirable
- ✓ Audit logging for all owner actions
- ✓ No client-side data exposure
- ✓ Redirect unauthorized users
- ✓ Custom claims verified server-side

---

## 9. KEY FEATURES

| Feature | Status | Priority |
|---------|--------|----------|
| Auth & access control | PLAN | HIGH |
| KPI dashboard | PLAN | HIGH |
| Business list/detail | PLAN | HIGH |
| Subscriptions view | PLAN | HIGH |
| Internal notes | PLAN | MEDIUM |
| Activity tracking | PLAN | MEDIUM |
| Error/incident view | PLAN | MEDIUM |
| Operations monitor | PLAN | LOW |
| Settings | PLAN | LOW |

---

## 10. TIME ESTIMATE

**Total: ~9 hours of focused work**
- DB + Auth: 2h
- Queries: 1.5h
- UI foundation: 5h
- Testing: 0.5h

Will implement **incrementally** with clear checkpoints.

---

## 11. FILES TO CREATE/MODIFY

**New files:**
- supabase/migrations/036_owner_portal.sql
- src/app/(owner)/layout.tsx
- src/app/(owner)/dashboard/page.tsx
- src/app/(owner)/businesses/page.tsx
- src/app/(owner)/businesses/[id]/page.tsx
- + all section pages
- src/app/api/owner/stats.ts
- src/app/api/owner/businesses.ts
- src/app/api/owner/init.ts
- src/lib/owner/*.ts
- src/components/owner/*.tsx

**Modified files:**
- .env.example (OWNER_INIT_SECRET)
- src/middleware.ts or new guard logic

---

Ready to execute. Start Phase 1 now.
