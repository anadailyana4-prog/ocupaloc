#!/usr/bin/env bash
# OcupaLoc.ro — first-time local setup (safe for distribution; never copies secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> OcupaLoc.ro install"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install: npm install -g pnpm"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ is required."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example — fill Supabase + optional integrations."
else
  echo ".env.local already exists (not overwritten)."
fi

echo "==> pnpm install"
pnpm install

echo ""
echo "Next steps:"
echo "  1. Edit .env.local (NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, etc.)"
echo "  2. Link Supabase:  pnpm dlx supabase link --project-ref <your-ref>"
echo "  3. Apply DB:       pnpm dlx supabase db push --linked"
echo "  4. Dev server:     pnpm run dev   → http://127.0.0.1:8788"
echo "  5. Quality gate:   pnpm run check:local"
echo ""
echo "Do NOT commit .env.local or distribute ZIPs that include env files with real keys."
