@AGENTS.md

# Reading Log

Personal reading time tracker, conceived as a project time tracker — **not** a habit tracker. No timers, stopwatches, streaks, goals or gamification: sessions are logged after reading, like sets in gym-log (pick a book, ±N minutes, Registrar).

## Conventions

- All code, comments and commits in English. UI text in Spanish (voseo, like gym-log).
- No ORM: `@libsql/client` with raw SQL. Schema in `db/schema.sql` (idempotent), applied with `node --env-file=.env.local db/apply-schema.mjs`.
- Pages are Server Components reading through `src/lib/data.ts`; mutations are Server Actions in `src/app/actions.ts`. Every data function and action calls `requireSession()` — the proxy (`src/proxy.ts`) only redirects.
- Timestamps are ISO-8601 UTC strings. Anything calendar-based (day grouping, hour of day, displayed dates) goes through `APP_TIME_ZONE` in `src/lib/time.ts`, never UTC.
- `sessions.read_at` is when the reading **ended**.
- Books come from two Notion databases, **read-only** (never write to Notion). `library` = which database: `informatica` → Carrera, `general` → Personal. Books missing from a sync get `removed_at` and stay (dimmed) if they have sessions.
- Light "paper" palette defined as Tailwind theme tokens in `src/app/globals.css`. `career`/`personal` are the validated chart pair; `*-soft` variants are backgrounds only.
- Local dev can use `TURSO_DATABASE_URL=file:local.db` (gitignored).
