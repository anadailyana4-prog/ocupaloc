#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups/supabase"
STAMP="$(date +%Y%m%d-%H%M%S)"
MODE="${1:-full}"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"

mkdir -p "${BACKUP_DIR}"

SCHEMA_FILE="${BACKUP_DIR}/schema-${STAMP}.sql"
DATA_FILE="${BACKUP_DIR}/data-${STAMP}.sql"

docker_ready() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

dump_with_pg_dump() {
  if [[ -z "${SUPABASE_DB_URL}" ]]; then
    echo "[backup] Docker is unavailable and SUPABASE_DB_URL is not set."
    echo "[backup] Set SUPABASE_DB_URL in your shell and rerun, or start Docker Desktop."
    exit 2
  fi

  if [[ "${MODE}" == "schema" ]]; then
    echo "[backup] dumping schema via pg_dump to ${SCHEMA_FILE}"
    pg_dump "${SUPABASE_DB_URL}" --schema=public --schema-only --no-owner --no-privileges > "${SCHEMA_FILE}"
    echo "[backup] done"
    exit 0
  fi

  echo "[backup] dumping schema via pg_dump to ${SCHEMA_FILE}"
  pg_dump "${SUPABASE_DB_URL}" --schema=public --schema-only --no-owner --no-privileges > "${SCHEMA_FILE}"

  echo "[backup] dumping public data via pg_dump to ${DATA_FILE}"
  pg_dump "${SUPABASE_DB_URL}" --schema=public --data-only --no-owner --no-privileges > "${DATA_FILE}"
}

if docker_ready; then
  if [[ "${MODE}" == "schema" ]]; then
    echo "[backup] dumping schema to ${SCHEMA_FILE}"
    pnpm dlx supabase db dump --linked --schema public -f "${SCHEMA_FILE}"
    echo "[backup] done"
    exit 0
  fi

  echo "[backup] dumping schema to ${SCHEMA_FILE}"
  pnpm dlx supabase db dump --linked --schema public -f "${SCHEMA_FILE}"

  echo "[backup] dumping public data to ${DATA_FILE}"
  pnpm dlx supabase db dump --linked --data-only --schema public -f "${DATA_FILE}"
else
  dump_with_pg_dump
fi

echo "[backup] done"
echo "[backup] files:"
echo "  - ${SCHEMA_FILE}"
echo "  - ${DATA_FILE}"
