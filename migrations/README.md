# Database Migrations

ConVol's Postgres schema lives here as a set of numbered SQL files.
Running them in order against a fresh Postgres database produces the schema
the application expects.

This directory replaces the previous arrangement, where the schema existed
only in Supabase's cloud dashboard and could not be reproduced from a `git
clone`. See [`docs/architecture/decisions.md`](../docs/architecture/decisions.md)
for the rationale.

## Running migrations

Migrations are applied by [`scripts/migrate.sh`](../scripts/migrate.sh), a small
psql-based runner. It applies every `.sql` file in this directory (in filename
order) exactly once, recording each in a `schema_migrations` table on the
database. Each file and its ledger row are written in a single transaction, so a
file that fails halfway is not recorded and is retried on the next run.

You do not normally run it by hand: the `migrate` service in
[`docker-compose.yml`](../docker-compose.yml) runs it automatically before the
app starts, and production runs the same script. It uses only `psql` from the
Postgres image, so it has no dependency on the application image or on Node.

To run it manually against an arbitrary database, set `DATABASE_URL` (it looks
like `postgres://user:pass@host:5432/dbname`) and, from a shell with `psql` and
this repo mounted at `/migrations` with the script at `/migrate.sh`:

```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname sh scripts/migrate.sh
```

There is no automated "down" — migrations are forward-only. To reverse one, add
a new numbered migration that undoes it.

## Adding a new migration

Number sequentially, describe what it does in the filename:

```
migrations/
  001_initial_schema.sql        # already here
  002_add_ticket_lifecycle.sql  # a hypothetical future migration
```

Guidelines:

- **Never edit an existing migration** once it has been run against a real
  database. Add a new numbered migration that alters or fixes.
- Prefer explicit `CREATE TABLE` / `ALTER TABLE` statements over anything
  clever.
- Include a header comment explaining what the migration does and why. The
  SQL is the source of truth; the comment is for the humans reviewing PRs.
- Order matters within a file: parents before children (see how
  `001_initial_schema.sql` orders things).
- If a migration is destructive (drops a column, drops a table), call that
  out prominently in the header comment.

## Foreign key policy

The initial schema uses a mix of `ON DELETE RESTRICT` and `ON DELETE CASCADE`:

- **RESTRICT** on parent tables (locations, departments, shift types, shifts,
  volunteers when children carry audit data) — deletes fail unless the
  children are cleaned up first.
- **CASCADE** for signups and shift-side checkins — data whose meaning is
  bound to the parent.

New tables should follow the same principle: cascade only if the child row
is meaningless without the parent.
