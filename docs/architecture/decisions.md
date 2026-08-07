# ConVol Architecture Decisions

Living record of decisions that shape ConVol's architecture. Each decision
captures what was chosen, why, and what would trigger revisiting it.

The founding [project brief](../BRIEF.md) describes intent as of April 2026;
this document describes the current architectural direction. When they
disagree, this document wins.

**Last updated:** 2026-08-06

---

## Update — 2026-08-06: Staff auth implemented

Items 4–5 of the Implementation Order below shipped, resolving the
previously-deferred **staff authentication mechanism** in favor of **email +
password** (scrypt hashing, stateless signed-cookie sessions). Magic link was
preferred on paper but password has no email-delivery dependency, which matters
for a single-container self-host.

- A `staff` table (migration `002_staff_auth.sql`) with a `role` column
  (default `staff`) so finer roles can arrive later without a migration.
- All `/admin/*` pages and `/api/admin/*` routes now require a staff session
  (closes issue #16 — previously anyone with the URL had full admin).
- **First-run bootstrap:** when no staff exist, `/setup` creates the first
  account. `CONVOL_ROOT_ADMIN_EMAIL` (env) optionally restricts who may claim
  it. This realizes the "bootstrap root-admin email" idea from Decision 1.
- `checked_in_by` / `awarded_by` are now populated with the acting staff
  member's email (still `text`, not yet a FK — see the data-model review).

Also landed alongside: the public `/raffle` page no longer exposes the full
volunteer roster (it's an email lookup now; the roster lives in the
auth-protected `/admin/raffle`); Sched env vars reconciled to `SCHED_URL` /
`SCHED_TOKEN`; volunteer auto-provision from Sched in `/my-shifts`; and the
repo `docker-compose.yml` migrate service now uses the same psql runner
(`scripts/migrate.sh`) as production.

---

## Update — 2026-08-07: Staff management (super-admin UI)

Realizes the "staff are added and removed through a super-admin UI" half of
Decision 1. `/admin/staff` lets an existing staff member invite coordinators,
see pending invites, and remove accounts.

- **Invite-by-link, no email/SMTP:** creating an invite (migration
  `003_staff_invites.sql`) returns a one-time `/invite/<token>` link the admin
  hands off out of band (Discord, etc.). The invitee sets their own password,
  which creates their `staff` row and signs them in. Only the SHA-256 hash of
  the token is stored; tokens expire in 7 days and are single-use.
- **Lockout guards:** you cannot remove your own account or the last remaining
  staff account.
- Roles are still a single `staff` tier; the UI does not yet expose role
  selection because nothing enforces role differences yet. When authorization
  by role lands, the invite/create paths grow a role picker.

---

## Context

ConVol was scaffolded in April 2026 following a Vercel + Next.js + Supabase
quick-start guide, targeting JordanCon 2026 as the founding use case.
JordanCon 2026 has since concluded without ConVol going into production.

The founding brief states a goal of "the first production-grade, modern-stack,
open source volunteer management tool designed for the unique operational
needs of fan conventions." The immediate priority is making the project
sustainable beyond a single developer — code that a future contributor can
understand, run, and extend.

These decisions were made together in a working session on 2026-07-15 to
answer that sustainability question before any further feature work.

---

## Decisions

### 1. Access & Trust Model

**Volunteers do not log in.** They identify themselves by entering the same
email address they use in Sched. ConVol matches that email against
Sched-synced data (attendees, sessions, speaker roles) pulled via the Sched
API using the convention's API key.

**Staff accounts are managed inside ConVol, separately from Sched.** Staff
authenticate with email plus either a magic link or a password (final
mechanism deferred, but magic link is preferred for lower operational
burden). Staff are added and removed through a super-admin UI inside
ConVol; a bootstrap root-admin email is provided via environment variable
on first deploy.

**Why:**

- Sched is already the source of truth for who is attending a convention
  and what their contact info is. Duplicating that into a ConVol accounts
  table adds a data-sync problem with no user-facing benefit.
- Volunteers at a fan convention are trusted actors within a badged
  environment. Requiring passwords for a "look up my shifts" flow adds
  friction without adding real security.
- Staff are a much smaller, more privileged group. Per-person identity
  matters for audit trails (who checked whom in, who awarded which
  raffle ticket), and there is no external directory to pull them from.

**Would revisit if:**

- A convention wanted to run ConVol without Sched, breaking the volunteer
  identity model.
- Volunteer data grew sensitive enough to require real authentication
  (personally identifiable info beyond names, contact details, medical
  or accessibility notes stored per-volunteer).

---

### 2. Deployment & Tenancy

**Single-tenant.** One ConVol instance serves exactly one convention. There
is no `conventions` table and no scoping of data by convention.

**Michael hosts JordanCon's production instance** through at least the
first real production year. JordanCon's operational reality is SaaS-first
(Sched, Discord, social media, a marketing-only website); there is no
technical operator on their side to run their own container.

**Self-hosting is a first-class citizen** in the codebase and documentation.
The intended distribution model is a GitHub repository plus a
`docker-compose.yml` that a technical operator at another convention (or a
consultant helping them) can run with `docker compose up`.

**Two adoption paths** are documented for future conventions:

1. **Self-host** — clone, configure env vars, run. Intended for cons with
   IT staff or a technical volunteer.
2. **Hosted by an operator** — Michael or another technical operator runs
   an instance for a convention that lacks in-house IT.

**Why:**

- Multi-tenancy is the single largest architectural weight a project like
  this can take on. Dropping it keeps ConVol small enough for a
  not-full-time developer to maintain.
- Fan conventions are annual events. A dedicated instance per convention
  means one convention's issues never affect another's.
- JordanCon and comparable small conventions do not have the operational
  culture to run their own multi-tenant SaaS, but they do have long-term
  volunteers who could run a single container.

**Would revisit if:**

- Enough small conventions wanted a hosted offering that a real multi-tenant
  product made economic sense.
- A single convention grew large enough that "one instance per convention"
  became a scaling problem (not remotely plausible for volunteer counts
  in the low thousands).

---

### 3. Data Layer

**Bundled Postgres in Docker Compose** replaces the current Supabase
dependency. Postgres runs as a service in `docker-compose.yml` alongside
the Next.js application. Data lives in a local Docker volume owned by the
convention's host.

**Schema lives in the repository** as SQL migrations. This is a change
from the current state, where the schema exists only in Supabase's cloud
dashboard and is not reproducible from a fresh clone.

**The database connection string is env-var-configurable.** An operator who
prefers an external managed Postgres (including Supabase, RDS, or
self-managed) can point ConVol at it. The bundled Postgres is the default
and documented path.

**Why:**

- Supabase was originally chosen because a Vercel quick-start tutorial used
  it, not for a stack-level reason. Of Supabase's product surface
  (Postgres, Auth, Realtime, Storage, Edge Functions), ConVol uses only
  Postgres.
- Supabase's free tier pauses inactive projects after roughly one week of
  inactivity. Conventions are annual events. A paused database three weeks
  before JordanCon would be a serious problem.
- The schema-in-cloud arrangement means a fresh `git clone` cannot actually
  produce a running application. Moving migrations into the repository
  fixes that regardless of the DB choice.
- Bundled Postgres matches the operational shape of the rest of the stack
  (Docker + Caddy on a VPS) and removes an external account requirement.

**Would revisit if:**

- Managed Postgres became meaningfully cheaper or easier than running one
  container.
- ConVol grew a real need for one of Supabase's other services (Auth,
  Realtime, Storage) that would justify the dependency.

**Related side effect:** Row Level Security (RLS) becomes unnecessary.
With no browser-side database client and no anon-key data path, all
database access flows through server code that already knows who the
authenticated user is. The security boundary moves from the database to
the server route handler.

---

### 4. Core vs. Convention-Specific Features

The project brief lists six planned features. This decision splits them
into three groups so that non-JordanCon conventions can adopt ConVol
without inheriting JordanCon-specific behavior.

**Core (universal — every convention gets these):**

- QR code check-in
- Walk-up sign-up
- Understaffing dashboard
- iCal export

**Sched-dependent (only for conventions using Sched):**

- Sched API integration for schedule sync
- Volunteer identity via Sched email (from Decision 1)

Conventions that do not use Sched cannot currently use ConVol. A future
decision may add alternate identity sources; that is out of scope for now.

**JordanCon-flavored but broadly useful (module/toggle):**

- Raffle ticket tracking (see Decision 4a below)
- Ribbon-at-hours-threshold and PIN reward (future, not scoped here)

Modules are controlled by environment variables or admin settings that hide
the entire feature's UI and background behavior when disabled. This is
deliberately simpler than a plugin architecture; extensibility can be added
later if real demand appears.

**Why:**

- The universal features are what any convention would recognize as
  volunteer management. Building them well is table-stakes.
- The Sched integration is the fastest path to real utility for JordanCon
  and any other Sched-using convention. Building an abstraction over
  "any schedule source" before there is a second source is premature.
- Raffle tracking is genuinely valuable at conventions that run volunteer
  raffles. It is also genuinely irrelevant at conventions that do not.
  A hard toggle keeps both cases clean.

**Would revisit if:**

- A second, non-Sched-using convention adopted ConVol and drove real
  requirements for a schedule-source abstraction.
- The modules-as-toggles approach hit a real limit (e.g., a con wanting
  to customize the raffle logic itself, not just enable/disable it).

---

### 4a. Raffle Ticket Tracking

Raffle tickets have a **two-state lifecycle:**

1. **Earned** — created automatically when a volunteer is checked in to a
   shift. No physical ticket exists yet.
2. **Handed out** — a staff member gives the volunteer a physical numbered
   paper ticket and records the ticket number in ConVol. The volunteer
   drops the paper ticket into the raffle bin themselves.

**Paper tickets remain the source of truth for the raffle drawing itself.**
ConVol does not run the drawing. Its role is to maintain a searchable
ledger that supports:

- Reverse lookup: staff pulls ticket #247 from the bin, types it into
  ConVol, and sees whose ticket it is (useful when the volunteer's name
  is smudged, missing, or on a lost ticket).
- Forward lookup: a volunteer at `/raffle` sees their earned count and
  which numbered tickets they have been given.
- Reconciliation reporting: tickets earned, tickets still owed to
  volunteers, tickets handed out, tickets voided.
- Audit trail: which staff member handed out which ticket, and when.

**Hand-out is untimed.** Volunteers may claim earned tickets whenever they
reach the volunteer desk, not immediately after their shift. Both
one-at-a-time and bulk hand-out flows are supported in the admin UI.

**Schema additions to `raffle_tickets` (from current state):**

- `ticket_number` — nullable string, populated on hand-out.
- `handed_out_at` — nullable timestamp.
- `handed_out_by` — staff user id (audit trail).
- `voided_at` / `voided_reason` — nullable, for lost or reissued tickets.

Duplicate ticket-number handling is a small open question to resolve at
implementation time. The current lean is to reject duplicates in the UI
but not enforce uniqueness in the database, since paper is the source of
truth and staff may need to override in the field.

**Why:**

- The physical raffle is the volunteer-facing event. ConVol should augment
  it, not replace it.
- Distinguishing "earned" from "handed out" surfaces the queue of tickets
  volunteers are owed — a real operational need that a single "count"
  cannot represent.
- Per-staff hand-out attribution is only meaningful once staff have
  per-person accounts (Decision 1), which is why these decisions are
  coupled.

---

## Decisions Deferred

The following came up during the working session and are explicitly not
decided here:

- **Data model review.** A pass through every table, column, and
  relationship to identify what to keep, what to rename, and what is
  missing (audit log, roles table, waitlists were mentioned as
  candidates).
- **Where the brief lives.** Whether to update the founding project brief
  in place as `docs/BRIEF.md` or preserve it as-is and let this document
  supersede it. Leaning toward preserving the brief as a historical
  artifact.
- ~~**Staff authentication mechanism.** Magic link vs. password not yet
  finalized; both fit Decision 1.~~ **Resolved 2026-08-06:** email + password
  (see the update note at the top of this document).
- **Duplicate ticket number handling.** UI-reject vs. DB-unique — final
  call at implementation time.
- **Ribbon-at-3-hours and PIN reward.** Acknowledged as a future feature;
  not designed here.

---

## Implementation Order (Suggested)

Not a promise — a working order that respects dependencies from the
decisions above.

1. Add migrations for the current schema to the repository. Unblocks
   reproducible setup regardless of DB choice.
2. Introduce a Docker Compose file that runs Postgres alongside the app.
   New setups can use it immediately; the Supabase path still works via
   env var.
3. Replace the Supabase client with a plain Postgres client throughout
   the codebase. Roughly 20–30 call sites; mechanical work.
4. Add staff authentication and a super-admin management UI.
5. Protect `/admin/*` routes behind staff auth. This closes the most
   significant current security gap.
6. Add the raffle ticket lifecycle fields and hand-out UI.
7. Remove Supabase from the dependency tree entirely once the migration
   is complete.

Feature work (understaffing alerts, deployment docs, VPS git credentials —
the remaining open GitHub issues) sits behind this foundation. Some of
those issues will be reframed or closed as no longer applicable after
this work lands.
