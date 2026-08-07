#!/bin/sh
# ConVol schema migrations, applied once each.
#
# Runs every *.sql file in /migrations (in filename order) exactly once against
# $DATABASE_URL, recording each in a `schema_migrations` ledger table. A file
# and its ledger row are written in a single transaction, so a file that fails
# halfway is not recorded and is retried on the next run rather than silently
# skipped.
#
# This is the canonical migration runner for ConVol, used both by the bundled
# docker-compose.yml (the `migrate` service mounts this script) and by the
# production deployment. It uses only psql from the postgres image — no Node
# tooling — so the migrate step has no dependency on the application image.
set -e

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (
     filename   text PRIMARY KEY,
     applied_at timestamptz NOT NULL DEFAULT now()
   )"

# One-time backfill: 001 predates this ledger on databases created before it
# existed. Detected by a table 001 creates rather than by assuming it ran, so
# this stays correct against a genuinely empty database too.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "INSERT INTO schema_migrations (filename)
   SELECT '001_initial_schema.sql'
   WHERE to_regclass('public.locations') IS NOT NULL
   ON CONFLICT (filename) DO NOTHING"

for f in /migrations/*.sql; do
  # An unmatched glob arrives as the literal pattern.
  [ -e "$f" ] || continue
  n=$(basename "$f")
  if [ "$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE filename = '$n'")" = "1" ]; then
    echo ">>> skip $n (already applied)"
    continue
  fi
  echo ">>> applying $n"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction \
    -f "$f" \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$n')"
done

echo ">>> migrations complete"
