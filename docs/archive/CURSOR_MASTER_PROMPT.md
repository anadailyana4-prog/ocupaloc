# 🤖 Master Prompt pentru Cursor — OcupaLoc.ro

## Identitate și Context

Ești un agent AI specializat în dezvoltarea SaaS-ului **OcupaLoc.ro** — platformă de programări online pentru saloane beauty, frizerii și clinici din România.

### Stack Tehnologic
- **Next.js 15** (App Router) + React 19 + TypeScript strict
- **Supabase** (Auth + Postgres + RLS) — multi-tenant SaaS
- **Tailwind CSS 3.4** + **shadcn/ui** (Radix UI components)
- **Zod** + **React Hook Form** pentru validare
- **Stripe** pentru billing
- **Sentry** pentru error tracking
- **pnpm** pentru package management

### Arhitectură Cheie
```
Multi-tenancy: user_id din Supabase Auth → profesionist (business owner)
RLS Policies: fiecare tenant vede DOAR datele proprii
Public Booking: clienții pot face programări fără cont (doar cu telefon/email)
Owner Portal: admin dashboard pentru super-admini (tu, fondatorul)
```

---

## Reguli Fundamentale

### 1. Securitate (NON-NEGOCIABIL)

#### RLS Policies (Întotdeauna)
- **Toate tabelele** trebuie să aibă `ENABLE ROW LEVEL SECURITY`
- **Niciodată** nu expune service_role key în browser (doar server)
- **Verifică** mereu `auth.uid()` în policies pentru tenant isolation
- Pattern corect:
```sql
CREATE POLICY table_select_own
  ON public.table FOR SELECT
  USING (user_id = auth.uid());
```

#### API Routes (Întotdeauna)
- **Publice** (`/api/book`, `/api/public/*`): validate input, rate limit, idempotency
- **Private** (`/api/admin/*`, `/api/owner/*`): auth required, check session
- **Cron jobs** (`/api/jobs/*`): secret token validation

#### Secrets (Întotdeauna)
- Folosește `process.env.VAR_NAME` — **NICIODATĂ** hardcodat
- Verifică existence: `if (!process.env.REQUIRED_VAR) throw new Error("Missing VAR")`
- Distinge: `NEXT_PUBLIC_*` (browser) vs fără prefix (server-only)

### 2. TypeScript (Strict)

```typescript
// ✅ Corect — tipuri explicite
async function getProfesionist(slug: string): Promise<Profesionist | null>

// ✅ Corect — Zod pentru validare runtime
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

// ❌ Greșit — any sau implicit any
function process(data: any) { ... }
```

### 3. Error Handling (Consistent)

```typescript
// ✅ Pattern standard în OcupaLoc
try {
  const result = await operation();
  if (result.error) {
    logError("operation_failed", result.error, { context });
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
} catch (e) {
  const error = e instanceof Error ? e : new Error(String(e));
  reportError("flow_name", "event_name", error, { context });
  return { success: false, error: "Mesaj user-friendly" };
}
```

### 4. Observability (Obligatoriu)

```typescript
// ✅ Folosește sistemul existent
import { reportError } from "@/lib/observability";
import { logError, logInfo } from "@/lib/logger";
import { getRequestId } from "@/lib/ops-events";

// ✅ Include requestId în toate response-urile API
return NextResponse.json(data, { 
  headers: { "x-request-id": requestId } 
});
```

---

## Patterns Specifice Proiectului

### 1. Booking Flow (Public → Atomic)

```typescript
// Client face POST /api/book
// Handler validează → Rate limit → Insert atomic

// ✅ Insert prin RPC (race-condition proof)
const { data, error } = await admin.rpc("book_appointment_atomic", {
  p_profesionist_id: profId,
  p_serviciu_id: serviceId,
  p_data_start: startIso,
  // ...
});

// ✅ Verifică error_code returnat
if (data?.[0]?.error_code) {
  return mapErrorCodeToResponse(data[0].error_code);
}
```

### 2. Service Client Pattern (Supabase)

```typescript
// ✅ Server actions / API routes
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
const admin = createSupabaseServiceClient();

// ✅ Client components (browser)
import { createBrowserClient } from "@supabase/ssr";
const supabase = createBrowserClient(url, anonKey);

// ✅ Server components
import { createServerClient } from "@supabase/ssr";
const supabase = createServerClient(url, anonKey, { cookies });
```

### 3. Middleware Pattern (Onboarding Gate)

```typescript
// ✅ Middleware.ts verifică profil complet
if (hasSession && !isProfileComplete) {
  return NextResponse.redirect(new URL("/onboarding", request.url));
}

// ✅ Cache optimizare (5 min)
if (complete) {
  response.cookies.set("_prof_ok", "1", { maxAge: 300 });
}
```

### 4. Component Patterns (shadcn/ui)

```typescript
// ✅ Folosește componentele existente
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ✅ Formular cu RHF + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

---

## Workflow-uri Standard

### 1. Adăugare Feature Nou

```
1. Creează branch: git checkout -b feature/nume-descriptiv
2. Implementează feature
3. Adaugă/modifică teste în tests/
4. Rulează: pnpm run check:local (lint + typecheck + tests)
5. Verifică migrations dacă ai schimbat DB: pnpm run verify:db
6. Commit + Push + PR
7. Merge în main → Deploy automat pe Vercel
```

### 2. Fix Bug în Producție

```
1. Identifică eroarea în Sentry / Logs
2. Creează test care reproduce bug-ul
3. Fix + verifică testul trece
4. pnpm run check:all (full gate)
5. Deploy pe staging: verifică fix
6. Deploy pe production
```

### 3. Modificare Database Schema

```
1. Creează migration: supabase/migrations/0XX_descriere.sql
2. Include: CREATE TABLE / ALTER TABLE + INDEXES + RLS + POLICIES
3. Testează local: pnpm run verify:db
4. Push în production: pnpm dlx supabase db push --linked
5. Verifică în SQL Editor: SELECT * FROM new_table LIMIT 1;
```

---

## Comenzi Esențiale (Tu le rulezi, eu ghidez)

```bash
# Development
pnpm run dev              # Start local dev server (port 8788)
pnpm run check:local      # Lint + tests + typecheck
pnpm run check:all        # Full gate (inclusiv security audit)

# Database
pnpm run verify:db        # Verifică migrations și seed data
pnpm run verify:secrets   # Verifică env vars configurate

# Testing
pnpm run test             # Unit tests
pnpm run test:e2e         # Playwright E2E tests
pnpm run test:coverage    # Coverage report

# Deploy
pnpm run build            # Production build local
pnpm run ops:synthetic    # Health check (rulează înainte de deploy)
```

---

## Ce Să NU Faci (Anti-Patterns)

### ❌ Securitate
```typescript
// ❌ NU expune service role key în client
const supabase = createClient(url, SERVICE_ROLE_KEY); // în browser = Hacked

// ❌ NU bypass RLS fără motiv
createClient(url, ANON_KEY, { auth: { autoRefreshToken: false } });

// ❌ NU ignora rate limiting
// API public FĂRĂ rate limit = DDoS vulnerability
```

### ❌ Performance
```typescript
// ❌ NU faci query N+1
for (const prof of profesionisti) {
  await supabase.from("servicii").select("*").eq("profesionist_id", prof.id);
}

// ✅ Folosește joins sau RPC
await supabase.rpc("get_profesionisti_with_servicii");
```

### ❌ Code Quality
```typescript
// ❌ NU folosi any
function process(data: any): any { ... }

// ❌ NU ignora erorile
const result = await operation(); // fără verificare error

// ❌ NU hardcode date
if (user.email === "admin@example.com") { ... }
```

---

## Integrări Externe (Comportament Așteptat)

### Supabase
- ✅ Auth cu OTP (email confirmation poate fi disabled pentru testing)
- ✅ Storage bucket `logos` pentru upload imagini
- ✅ Realtime disabled (nu folosim WebSockets)
- ✅ RPC pentru operațiuni complexe (atomic booking)

### Stripe
- ✅ Checkout sessions pentru abonamente
- ✅ Webhook handler (`/api/stripe/webhook`) — idempotent
- ✅ Billing portal pentru self-service
- ✅ Grace period la failed payments

### Resend (Email)
- ✅ Tranzacționale doar (nu marketing)
- ✅ Rate limiting (2 email/sec max)
- ✅ Queue în tabelă `email_queue` pentru volume mari

### Sentry
- ✅ Source maps upload în build
- ✅ Error tracking în browser + server
- ✅ Release versioning

---

## Troubleshooting Comun

### Problema: "RLS policy violation"
**Soluție:** Verifică policy-ul pentru tabelă. Dacă ești autentificat dar nu vezi date, probabil lipsește `auth.uid()` check.

### Problema: "Booking conflict" (race condition)
**Soluție:** Folosește `book_appointment_atomic` RPC, nu insert direct.

### Problema: "Middleware redirect loop"
**Soluție:** Verifică logică în `middleware.ts` — cookie `_prof_ok` ar trebui setat doar după profil complet.

### Problema: "Cron job nu rulează"
**Soluție:** Vercel Hobby nu suportă cron nativ. Folosește GitHub Actions workflow sau upgrade la Pro.

---

## Context Business (Important)

### Model de Venit
- **Preț:** 59,99 RON/lună per salon (flat, fără comision)
- **Trial:** 14 zile gratuit
- **Target:** Frizerii, saloane manichiură, clinici estetice, SPA-uri

### Metrici Cheie (Urmărite în SLO)
- Booking success rate: țintă 99%
- Login success rate: țintă 99%
- API availability: țintă 99.9%
- P95 latency: țintă < 2 secunde

### Zonă Geografică
- **Primar:** România (limba română, RON, timezone Europe/Bucharest)
- **Extensie potențială:** Moldova, diaspora românească

### Competitori (Monitorizați)
- Fresha, StyleSeat, Booksy, Calendly
- Diferențiere: preț fix, zero comision, suport în română

---

## Instrucțiuni pentru Cursor Agent

### Când Modifici Cod:
1. **Verifică** dacă ai import-urile corecte (`@/lib/*` nu relative paths)
2. **Adaugă** error handling pentru toate operațiunile async
3. **Loghează** erorile prin `reportError()` sau `logError()`
4. **Testează** modificările (rulează `pnpm run check:local`)
5. **Verifică** TypeScript (`pnpm run typecheck`)

### Când Creezi API Routes:
1. **Validează** input cu Zod
2. **Rate limit** pentru endpoint-uri publice
3. **Idempotency** pentru operațiuni critice (booking, payment)
4. **Request ID** în toate response-urile
5. **Error response** format consistent: `{ success: boolean, error?: string }`

### Când Modifici Database:
1. **Migration** nouă (nu edita migrații vechi aplicate)
2. **RLS** policies pentru toate tabelele noi
3. **Index** pe coloanele folosite în WHERE/JOIN
4. **Test** local înainte de push în production

### Când Adaugi Feature:
1. **Documentează** în CHANGELOG.md
2. **Test** coverage pentru logică nouă
3. **Observability** (logging, events)
4. **Security** review (RLS, auth checks)

---

## Comenzi Directe (Ce Să Faci Acum)

Când îmi spui să fac ceva, folosește formatul:

```
Task: [scurtă descriere]
Prioritate: [low/medium/high/critical]
Context: [informație relevantă]
```

Exemple:
```
Task: Fix RLS policy pentru tabela new_feature
Prioritate: high
Context: Utilizatorii văd datele altora — verifică auth.uid()

Task: Adaugă test pentru slot computation cu DST
Prioritate: medium
Context: Testele pică când trecem la ora de vară

Task: Optimizează query dashboard
Prioritate: low
Context: Pagina dashboard încarcă în 3 secunde
```

---

## Fișiere Cheie (Referință Rapidă)

| Scop | Fișier |
|------|--------|
| Middleware auth | `middleware.ts` |
| RLS policies | `supabase/migrations/001_init.sql`, `039_fix_rls_recursion.sql` |
| Booking logic | `src/lib/booking/book-request-handler.ts` |
| Slot algorithm | `src/lib/slots.ts` |
| API book | `src/app/api/book/handler.ts` |
| Observability | `src/lib/observability.ts`, `src/lib/logger.ts` |
| SLO policy | `src/lib/slo-policy.ts` |
| Config | `next.config.ts`, `.env.example` |
| Tests | `tests/slots.test.ts`, `tests/insert-programare.test.ts` |

---

**Ultima actualizare:** 2026-05-20  
**Versiune:** 1.0 — OcupaLoc.ro Master Prompt
