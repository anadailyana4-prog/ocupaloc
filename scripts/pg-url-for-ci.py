#!/usr/bin/env python3
"""Resolve Supabase Postgres URLs to IPv4 for GitHub Actions runners."""

import socket
import subprocess
import sys
from urllib.parse import quote, urlsplit, urlunsplit


def _resolve_ipv4_host(host: str) -> str | None:
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

    return None


def pg_url_for_ci(db_url: str) -> str:
    parts = urlsplit(db_url)
    host = parts.hostname
    if not host:
        return db_url

    if not (host.startswith("db.") and host.endswith(".supabase.co")):
        print(
            f"Expected direct host db.<project>.supabase.co, got {host}. "
            "Run normalize-supabase-db-url.py first if the secret is a pooler URL.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    port = 5432
    ipv4 = _resolve_ipv4_host(host)
    if not ipv4:
        print(
            f"Could not resolve IPv4 for {host}. "
            "Use SUPABASE_DIRECT_DB_URL (db.<project>.supabase.co:5432) in GitHub secrets.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    user = quote(parts.username or "", safe="")
    password = quote(parts.password or "", safe="")
    auth = f"{user}:{password}@" if parts.username else ""
    netloc = f"{auth}{ipv4}:{port}"
    return urlunsplit((parts.scheme, netloc, parts.path or "/postgres", parts.query, parts.fragment))


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: pg-url-for-ci.py <database_url>", file=sys.stderr)
        return 1

    print(pg_url_for_ci(sys.argv[1]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
