#!/usr/bin/env bash
# Fails if a distribution archive would include secret-bearing env files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BLOCKED=()
for pattern in .env.local .env.prod.local .env.production.local .env.vercel.*; do
  for f in $pattern; do
    [[ -e "$f" ]] && BLOCKED+=("$f")
  done
done

if ((${#BLOCKED[@]} > 0)); then
  echo "BLOCKED: remove or exclude these before zipping the repo:"
  printf '  - %s\n' "${BLOCKED[@]}"
  echo ""
  echo "Safe to ship: git clone + .env.example only."
  exit 1
fi

echo "OK: no local secret env files in project root (safe to archive source)."
