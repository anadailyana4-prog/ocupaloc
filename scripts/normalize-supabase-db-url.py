#!/usr/bin/env python3

import sys
from urllib.parse import quote, urlsplit, urlunsplit


def normalize_db_url(db_url: str) -> str:
    parts = urlsplit(db_url)
    username = parts.username or ""
    password = parts.password or ""

    if username.startswith("postgres."):
        project_ref = username.split(".", 1)[1]
        user_enc = quote("postgres", safe="")
        pass_enc = quote(password, safe="")
        netloc = f"{user_enc}:{pass_enc}@db.{project_ref}.supabase.co:5432"
        return urlunsplit((parts.scheme, netloc, parts.path or "/postgres", parts.query, parts.fragment))

    return db_url


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: normalize-supabase-db-url.py <db_url>", file=sys.stderr)
        return 1

    print(normalize_db_url(sys.argv[1]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())