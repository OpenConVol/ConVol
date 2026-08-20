-- Track the most recent invite view, not just the first.
--
-- A mail scanner often fetches a link once, right at delivery. A separate,
-- later view (last_viewed_at well after viewed_at) is the signal that a human
-- actually opened it. The Staff page shows both so an admin can tell them apart.
--
-- Non-destructive: adds one nullable column.

ALTER TABLE staff_invites ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;
