# Database Migrations

ConVol's Postgres schema lives here as a set of numbered SQL files.
Running them in order against a fresh Postgres database produces the schema
the application expects.

This directory replaces the previous arrangement, where the schema existed
only in Supabase's cloud dashboard and could not be reproduced from a `git
clone`. See [`docs/architecture/decisions.md`](../docs/architecture/decisions.md)
for the rationale.

## Running migrations

Migrations are managed by [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate).
It looks at every `.sql` file in this directory (in filename order), tracks
which have already run in a `pgmigrations` table on the database, and applies
any it hasn't seen.

Set `DATABASE_URL` to your Postgres connection string, then:

```bash
npm run migrate         # apply all pending migrations
npm run migrate:down    # roll back the most recent migration
```

`DATABASE_URL` looks like `postgres://user:pass@host:5432/dbname`.

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
