# ConVol

> Open source volunteer management for fan conventions.

## What is ConVol?

ConVol is a modern, production-grade volunteer management system designed 
for the unique needs of fan conventions. Built by the convention community, 
for the convention community.

## Why ConVol?

Fan conventions run on volunteers. Existing tools like SignUp.com weren't 
built for this world — they lack shift check-in, walk-up sign-up, 
understaffing alerts, and the kind of real-time visibility that convention 
volunteer coordinators actually need.

ConVol is the tool that should have existed years ago.

## Planned Features

- QR code check-in and walk-up sign-up
- Real-time understaffing dashboard with auto-alerts
- Sched API integration — volunteers see their shifts alongside the 
  programming schedule
- Raffle/perk ticket tracking per shift
- iCal export for personal calendars
- One-click Vercel deploy for any convention

## Stack

- **Frontend:** Next.js
- **Backend/DB:** Supabase
- **Deployment:** Vercel

## Status

Early development. First production deployment coming 2026.

## Getting Started

Set up requires a Postgres database and a `DATABASE_URL` environment variable pointing at it.

```bash
npm install
npm run migrate        # apply schema migrations
npm run dev            # start the dev server
```

See [`migrations/README.md`](migrations/README.md) for details on the migration system, and [`docs/architecture/decisions.md`](docs/architecture/decisions.md) for the current architectural direction (bundled Postgres via Docker Compose is coming; managed Postgres or Supabase also work).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
