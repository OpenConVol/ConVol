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

## Stack

- **Frontend:** Next.js
- **Backend/DB:** Postgres (bundled via Docker Compose)
- **Deployment:** Docker Compose (any Linux host)

## Status

Early development. First production deployment coming 2026.

## Getting Started

```bash
cp .env.example .env
docker compose up
```

This starts Postgres, runs migrations, and boots the app at http://localhost:3000. First-time boot builds the app image and takes a few minutes.

See [`migrations/README.md`](migrations/README.md) for details on the migration system, and [`docs/architecture/decisions.md`](docs/architecture/decisions.md) for the current architectural direction.

### Development

- `docker compose down` — stop the stack.
- `docker compose down -v` — stop the stack and nuke the database.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
