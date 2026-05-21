#!/usr/bin/env python3
"""Set GitHub secret SUPABASE_DB_URL for pg_dump backups (Session pooler).

Requires SUPABASE_DATABASE_PASSWORD: the database password from Supabase Dashboard
(Database → Connect → Session pooler URI uses this; it is not the CLI login token).

Do not use `cli_login_postgres.*` credentials for backups — pooler accepts them but
pg_dump needs table locks; that role hits \"permission denied\" on application tables.

Usage:
  SUPABASE_DATABASE_PASSWORD='your-db-password' python3 scripts/sync-github-supabase-db-secret.py

Optional: GITHUB_REPOSITORY=owner/repo (defaults to anadailyana4-prog/ocupaloc).
"""

from __future__ import annotations

import os
import subprocess
import sys
from urllib.parse import quote, urlsplit, urlunsplit

# Default when GITHUB_REPOSITORY is unset (e.g. local run)
DEFAULT_GITHUB_REPO = "anadailyana4-prog/ocupaloc"

PROJECT_REF = "tffwoljimpdckvlogyqu"
POOLER_HOST = "aws-0-eu-west-1.pooler.supabase.com"
POOLER_PORT = 5432


def _session_pooler_url(password: str) -> str:
    user = f"postgres.{PROJECT_REF}"
    netloc = f"{quote(user, safe='')}:{quote(password, safe='')}@{POOLER_HOST}:{POOLER_PORT}"
    return urlunsplit(("postgresql", netloc, "/postgres", "", ""))


def main() -> int:
    password = os.environ.get("SUPABASE_DATABASE_PASSWORD", "").strip()
    if not password:
        print(
            "Set SUPABASE_DATABASE_PASSWORD to your Supabase database password, then re-run.\n"
            "Source: Dashboard → Database settings → Connect → Direct → Session pooler → URI "
            "(replace [YOUR-PASSWORD]). Reset password there if you no longer have it.",
            file=sys.stderr,
        )
        return 1

    db_url = _session_pooler_url(password)
    repo = os.environ.get("GITHUB_REPOSITORY", DEFAULT_GITHUB_REPO).strip() or DEFAULT_GITHUB_REPO

    set_proc = subprocess.run(
        ["gh", "secret", "set", "SUPABASE_DB_URL", "--repo", repo],
        input=db_url,
        text=True,
        capture_output=True,
    )
    if set_proc.returncode != 0:
        print(set_proc.stderr or set_proc.stdout, file=sys.stderr)
        return set_proc.returncode

    parts = urlsplit(db_url)
    print(
        f"Updated SUPABASE_DB_URL on {repo} (host={parts.hostname}, user={parts.username}, "
        f"port={parts.port}, password_len={len(password)})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
