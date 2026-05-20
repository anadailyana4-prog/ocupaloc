#!/usr/bin/env python3
"""Prepare Supabase credentials for pg_dump on GitHub Actions (writes backup-pg.env)."""

import os
import shlex
import socket
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

# Dashboard copy-paste often uses eu-central-1; production project is West EU (Ireland).
CANONICAL_POOLER_HOST_BY_REF: dict[str, str] = {
    "tffwoljimpdckvlogyqu": "aws-0-eu-west-1.pooler.supabase.com",
    "zezhiteevqfgtmqedduq": "aws-0-eu-west-1.pooler.supabase.com",
}
CANONICAL_POOLER_IPV4_BY_HOST: dict[str, str] = {
    "aws-0-eu-west-1.pooler.supabase.com": "34.241.16.247",
}


def _canonical_pooler_host(username: str, host: str) -> str:
    if "pooler.supabase.com" not in host or not username.startswith("postgres."):
        return host
    project_ref = username.split(".", 1)[1]
    return CANONICAL_POOLER_HOST_BY_REF.get(project_ref, host)


def _resolve_ipv4(host: str) -> str:
    try:
        infos = socket.getaddrinfo(host, 5432, socket.AF_INET, socket.SOCK_STREAM)
        if infos:
            return infos[0][4][0]
    except socket.gaierror:
        pass

    try:
        output = subprocess.check_output(["getent", "ahostsv4", host], text=True, stderr=subprocess.DEVNULL)
        for line in output.splitlines():
            parts = line.split()
            if parts and parts[0].count(".") == 3:
                return parts[0]
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        pass

    fallback = CANONICAL_POOLER_IPV4_BY_HOST.get(host)
    if fallback:
        return fallback

    raise SystemExit(f"Could not resolve IPv4 for {host}.")


def prepare_backup_connection(db_url: str) -> dict[str, str]:
    parts = urlsplit(db_url)
    host = parts.hostname or ""
    username = unquote(parts.username or "")
    password = unquote(parts.password or "")
    database = (parts.path or "/postgres").lstrip("/") or "postgres"

    if not host or not username or not password:
        raise SystemExit("SUPABASE_DB_URL must include host, user and password.")

    port = parts.port or 5432

    # pg_dump needs session pooler (5432), not transaction pooler (6543).
    if "pooler.supabase.com" in host and port == 6543:
        port = 5432

    # Session pooler auth uses postgres.<project_ref>, not bare "postgres".
    project_ref = os.environ.get("SUPABASE_PROJECT_REF", "").strip()
    if "pooler.supabase.com" in host and username == "postgres" and project_ref:
        username = f"postgres.{project_ref}"

    if not username.startswith("postgres."):
        raise SystemExit(
            "SUPABASE_DB_URL must be the Session pooler URI from Supabase "
            "(user postgres.<project_ref>, port 5432), or use user `postgres` on the pooler "
            "together with env SUPABASE_PROJECT_REF. "
            "Dashboard: Project Settings → Database → Connection string → Session mode."
        )

    if "pooler.supabase.com" not in host and not host.startswith("db."):
        raise SystemExit(f"Unexpected database host: {host}")

    host = _canonical_pooler_host(username, host)
    pg_host = _resolve_ipv4(host)

    return {
        "PGHOST": pg_host,
        "PGPORT": str(port),
        "PGUSER": username,
        "PGPASSWORD": password,
        "PGDATABASE": database,
    }


def write_env_file(path: Path, values: dict[str, str]) -> None:
    lines = [f"{key}={shlex.quote(value)}" for key, value in values.items()]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("Usage: prepare-backup-db-url.py <database_url> [output.env]", file=sys.stderr)
        return 1

    out = Path(sys.argv[2] if len(sys.argv) == 3 else "backup-pg.env")
    write_env_file(out, prepare_backup_connection(sys.argv[1]))
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
