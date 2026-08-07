-- ConVol staff authentication.
--
-- Adds the `staff` table that backs in-app staff accounts, per
-- docs/architecture/decisions.md Decision 1. Staff authenticate with email +
-- password (scrypt hash). A `role` column exists from the start (default
-- 'staff') so finer-grained roles can be introduced later without another
-- migration or table.
--
-- This closes issue #16: until now every /admin/* page and /api/admin/* route
-- was reachable by anyone with the URL. The application now requires a valid
-- staff session for all of them.
--
-- Non-destructive: creates one new table and touches nothing that exists.

CREATE TABLE IF NOT EXISTS staff (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'staff',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
