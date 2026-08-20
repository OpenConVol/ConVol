-- ConVol invite view tracking.
--
-- Records when an invite link is opened (not just accepted), so an admin can
-- see whether an invitee has looked. Caveat: some mail systems pre-fetch links
-- to scan them, so a view can be a scanner rather than a human; treat as a soft
-- signal, and read view_count/timing rather than mere presence.
--
-- Non-destructive: adds two nullable/defaulted columns.

ALTER TABLE staff_invites ADD COLUMN IF NOT EXISTS viewed_at  timestamptz;
ALTER TABLE staff_invites ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
