# Reading Log

A minimal, mobile-first web app to log how much time goes into each book — a project time tracker for reading, not a habit tracker. No timers, streaks or goals: after reading, pick the book, set the minutes and tap **Registrar**.

Books aren't managed here: they're read from two Notion databases (one for career books, one for personal development), which stay the source of truth.

## Features

- **Registrar** — the books currently marked "Leyendo" as big cards, search for any other one, a ±5 minute stepper that starts at your last logged amount, and an optional date/time (defaults to now). Undo right after logging.
- **Biblioteca** — every book from both Notion databases, grouped by reading status, with the total time logged. Each book has its own page with its sessions, editable.
- **Estadísticas** — this week vs. your recent average, minutes per week by track (career / personal), days with reading in the last 30, when in the day you read, and totals per book.
- **Ajustes** — sync with Notion, stepper size, CSV export, log out.

Behind a single password (a signed, long-lived cookie). Enough for one person; not a multi-user auth model.

## Stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Turso](https://turso.tech) (libSQL / SQLite), no ORM
- [Notion API](https://developers.notion.com) (read-only)
- Deployed on [Vercel](https://vercel.com), installed on Android as a PWA

## Setup

1. Create the database and apply the schema:
   ```bash
   turso db create reading-log
   cp .env.local.example .env.local   # fill TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
   node --env-file=.env.local db/apply-schema.mjs
   ```
   For local-only development, `TURSO_DATABASE_URL=file:local.db` works without a token.
2. Set `APP_PASSWORD` and `AUTH_SECRET` (`openssl rand -hex 32`) in `.env.local`.
3. Notion: create an internal integration at [notion.so/profile/integrations](https://www.notion.so/profile/integrations), copy its token to `NOTION_TOKEN`, and connect it to both databases (⋯ → Connections). Set `NOTION_DATA_SOURCE_GENERAL` / `NOTION_DATA_SOURCE_INFORMATICA` to their data source ids. The expected properties are `Nombre`, `Autor`, `Categoría`, `Estado de lectura` and `Rating`.
4. Run it:
   ```bash
   npm install
   npm run dev
   ```
   Log in, go to **Ajustes → Sincronizar con Notion**.

## Deploy

Import the repo in Vercel and add the same environment variables (none are `NEXT_PUBLIC_`: they never reach the browser). On Android, open the URL in Chrome → **Install app**.

## Data model

See [`db/schema.sql`](./db/schema.sql):

- `books` — local copy of the Notion pages, refreshed on each sync. Books deleted in Notion are marked `removed_at` instead of deleted, so their sessions keep counting.
- `sessions` — one row per reading session: book, minutes, and `read_at` (when it ended), as ISO-8601 UTC. Stats group days and hours in Argentina time.
- `settings` — key/value (`step_minutes`, `last_sync_at`).
