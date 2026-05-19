#!/usr/bin/env python3
"""Prepare SUPABASE_DB_URL (pooler or direct) for pg_dump on GitHub Actions."""

import socket
import subprocess
import sys
from urllib.parse import quote, urlsplit, urlunsplit


def _resolve_ipv4(host: str) -> str | None:
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


def _with_ipv4(db_url: str, port: int) -> str:
    parts = urlsplit(db_url)
    host = parts.hostname
    if not host:
        raise SystemExit("Invalid database URL: missing host.")

    ipv4 = _resolve_ipv4(host)
    if not ipv4:
        raise SystemExit(f"Could not resolve IPv4 for {host}.")

    user = quote(parts.username or "", safe="")
    password = quote(parts.password or "", safe="")
    auth = f"{user}:{password}@" if parts.username else ""
    netloc = f"{auth}{ipv4}:{port}"
    return urlunsplit((parts.scheme, netloc, parts.path or "/postgres", parts.query, parts.fragment))


def prepare_backup_db_url(db_url: str) -> str:
    parts = urlsplit(db_url)
    host = parts.hostname or ""
    username = parts.username or ""
    password = parts.password or ""
    path = parts.path or "/postgres"

    # Pooler URL (typical GitHub secret) -> session mode port 5432 for pg_dump.
    if "pooler.supabase.com" in host and username.startswith("postgres."):
        user_enc = quote(username, safe="")
        pass_enc = quote(password, safe="")
        session = urlunsplit(
            (parts.scheme, f"{user_enc}:{pass_enc}@{host}:5432", path, parts.query, parts.fragment)
        )
        return _with_ipv4(session, 5432)

    # Direct db.<ref>.supabase.co — try IPv4; fallback to session pooler on :5432.
    if host.startswith("db.") and host.endswith(".supabase.co"):
        project_ref = host.removeprefix("db.").removesuffix(".supabase.co")
        direct = urlunsplit(
            (
                parts.scheme,
                f"{quote(username, safe='')}:{quote(password, safe='')}@{host}:5432",
                path,
                parts.query,
                parts.fragment,
            )
        )
        try:
            return _with_ipv4(direct, 5432)
        except SystemExit:
            pooler_user = username if username.startswith("postgres.") else f"postgres.{project_ref}"
            user_enc = quote(pooler_user, safe="")
            pass_enc = quote(password, safe="")
            pooler_host = "aws-0-eu-central-1.pooler.supabase.com"
            session = urlunsplit(
                (parts.scheme, f"{user_enc}:{pass_enc}@{pooler_host}:5432", path, parts.query, parts.fragment)
            )
            return _with_ipv4(session, 5432)

    if username.startswith("postgres."):
        user_enc = quote(username, safe="")
        pass_enc = quote(password, safe="")
        pooler_host = host if "pooler.supabase.com" in host else "aws-0-eu-central-1.pooler.supabase.com"
        session = urlunsplit(
            (parts.scheme, f"{user_enc}:{pass_enc}@{pooler_host}:5432", path, parts.query, parts.fragment)
        )
        return _with_ipv4(session, 5432)

    raise SystemExit(
        "Unsupported SUPABASE_DB_URL. Use Supabase pooler URI (postgres.<ref> @ pooler.supabase.com)."
    )


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: prepare-backup-db-url.py <database_url>", file=sys.stderr)
        return 1

    print(prepare_backup_db_url(sys.argv[1]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
