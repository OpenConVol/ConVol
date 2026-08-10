-- ConVol staff password resets.
--
-- Backs the "forgot password" flow. A staff member requests a reset, we email
-- a one-time link (via Resend), and the link lets them set a new password.
-- Only the SHA-256 hash of the token is stored; tokens are single-use and
-- expire after one hour.
--
-- Non-destructive: creates one new table.

CREATE TABLE IF NOT EXISTS password_resets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

CREATE INDEX IF NOT EXISTS password_resets_email_idx ON password_resets (lower(email));
