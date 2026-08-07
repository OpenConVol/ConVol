-- ConVol settings store.
--
-- A simple key/value table for operator-configurable settings that belong in
-- the database rather than env (docs/architecture/decisions.md, onboarding /
-- theming notes). First consumer: convention branding — the `theme.*` keys
-- hold the handful of colors that reskin the app.
--
-- True security secrets (SESSION_SECRET) intentionally stay in env, not here.
--
-- Non-destructive: creates one new table.

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
