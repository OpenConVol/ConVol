-- ConVol initial schema.
--
-- This migration creates the schema that ConVol has been running against on
-- Supabase since the April 2026 scaffold. Two additions vs. the Supabase
-- version:
--   1. UNIQUE (email) on volunteers — required for the Sched-email identity
--      model described in docs/architecture/decisions.md.
--   2. UNIQUE (shift_id, volunteer_id) on raffle_tickets — prevents the
--      double-award race in awardAllPending (issue #19).
--   3. Index on shifts (start_time) — the calendar view scans this column;
--      Supabase has no index on it today.
--
-- Foreign key ON DELETE behavior:
--   - Parent tables (locations, departments, shift_types, shifts, volunteers)
--     are RESTRICTed. You can't delete a parent that has children — you must
--     clean up the children first. This is deliberate: it protects against
--     accidental cascade deletes.
--   - signups CASCADE from shifts and volunteers. Sign-ups only make sense
--     in context; when the shift or volunteer goes, they go.
--   - checkins CASCADE from shifts but RESTRICT from volunteers. A checkin
--     is audit history for the volunteer; deleting the volunteer while
--     checkin rows still exist should be blocked.
--   - raffle_tickets RESTRICT from both. Ticket records are audit history;
--     never lose them via cascade.
--
-- Ordering matters: parents before children. Do not resort.

-- ============================================================================
-- Locations, departments, shift types (hierarchy)
-- ============================================================================

CREATE TABLE locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  location_id uuid REFERENCES locations(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shift_types (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Shifts — the schedulable unit
-- ============================================================================

CREATE TABLE shifts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type_id     uuid REFERENCES shift_types(id) ON DELETE RESTRICT,
  location_id       uuid REFERENCES locations(id)   ON DELETE RESTRICT,
  department_id     uuid REFERENCES departments(id) ON DELETE RESTRICT,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz NOT NULL,
  volunteers_needed integer NOT NULL DEFAULT 1,
  description       text,
  is_designated     boolean NOT NULL DEFAULT false,
  designated_name   text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Calendar view (/shifts) filters and orders on start_time; add an index so
-- it does not full-table-scan as data grows.
CREATE INDEX shifts_start_time_idx ON shifts (start_time);

-- ============================================================================
-- Volunteers
-- ============================================================================

CREATE TABLE volunteers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  pronouns   text,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Sched-email lookup requires exactly one volunteer per email.
  CONSTRAINT volunteers_email_key UNIQUE (email)
);

-- ============================================================================
-- Sign-ups (volunteer claims a shift in advance)
-- ============================================================================

CREATE TABLE signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id      uuid REFERENCES shifts(id)     ON DELETE CASCADE,
  volunteer_id  uuid REFERENCES volunteers(id) ON DELETE CASCADE,
  signed_up_at  timestamptz NOT NULL DEFAULT now(),

  -- Same volunteer can't sign up for the same shift twice.
  CONSTRAINT signups_shift_id_volunteer_id_key UNIQUE (shift_id, volunteer_id)
);

-- ============================================================================
-- Check-ins (volunteer showed up and worked the shift)
-- ============================================================================

CREATE TABLE checkins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id       uuid REFERENCES shifts(id)     ON DELETE CASCADE,
  volunteer_id   uuid REFERENCES volunteers(id) ON DELETE RESTRICT,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  checked_in_by  text,

  -- Same volunteer can't be checked in twice for the same shift.
  CONSTRAINT checkins_shift_id_volunteer_id_key UNIQUE (shift_id, volunteer_id)
);

-- ============================================================================
-- Raffle tickets (earned per completed shift; physical ticket handed out later)
-- ============================================================================

CREATE TABLE raffle_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id  uuid REFERENCES volunteers(id) ON DELETE RESTRICT,
  shift_id      uuid REFERENCES shifts(id)     ON DELETE RESTRICT,
  awarded_at    timestamptz NOT NULL DEFAULT now(),
  awarded_by    text,
  notes         text,

  -- Prevents the awardAllPending double-award race (issue #19).
  -- One raffle ticket per (volunteer, shift). The two-state lifecycle
  -- (earned vs. handed out) is added in a later migration; this constraint
  -- is stable across that change.
  CONSTRAINT raffle_tickets_shift_id_volunteer_id_key UNIQUE (shift_id, volunteer_id)
);

-- ============================================================================
-- Sched integration cache
-- ============================================================================

CREATE TABLE sched_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sched_id     text NOT NULL,
  title        text NOT NULL,
  description  text,
  location     text,
  start_time   timestamptz,
  end_time     timestamptz,
  event_type   text,
  last_synced  timestamptz NOT NULL DEFAULT now(),

  -- One row per unique Sched event id; sync upserts on this key.
  CONSTRAINT sched_events_sched_id_key UNIQUE (sched_id)
);
