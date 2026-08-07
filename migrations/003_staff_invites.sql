-- ConVol staff invites.
--
-- Backs the staff-management UI (docs/architecture/decisions.md Decision 1,
-- "staff are added and removed through a super-admin UI"). An existing staff
-- member creates an invite for an email; the invitee opens a one-time link and
-- sets their own password, which creates their `staff` row. No passwords are
-- ever shared, and no email/SMTP is required — the link is handed off out of
-- band (Discord, etc.).
--
-- Only the SHA-256 hash of the token is stored, never the token itself, so a
-- database read cannot mint a working invite link.
--
-- Non-destructive: creates one new table.

CREATE TABLE IF NOT EXISTS staff_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  role        text NOT NULL DEFAULT 'staff',
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS staff_invites_email_idx ON staff_invites (lower(email));
