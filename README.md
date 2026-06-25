# Meridian

A minimalist, two-user (me + my brother) daily accountability app. TestFlight only.

> A meridian is the line a celestial body crosses at its highest point of the day. The app is exactly that: a daily high line we each reach for. This is not a rivalry — it's a shared standard of excellence we both hold ourselves to, every single day.

## Layout

```
meridian/
  apps/mobile/      Expo / React Native client (→ TestFlight)
  apps/api/         Next.js API on Vercel
  packages/shared/  Shared types, enums, date utils, scoring (single source of truth)
```

`packages/shared` is consumed as TypeScript source by both apps via the `@meridian/shared` path alias. No build step.

## Branches

- **A — Daily Non-Negotiables.** Each user owns a daily list (binary or target items), checks in for *today only* (no past edits), and the day's higher completion-% wins. Days are computed in a single canonical timezone (`America/New_York`) and lock at midnight ET.
- **B — Bucket List / Skills.** One shared list both see, in `shared` (both work it) or `challenge` (race) mode.

## Develop

```bash
npm install                 # install all workspaces

npm run api                 # apps/api on http://localhost:3000
npm run mobile              # Expo dev server

npm run db:generate         # generate Drizzle migration from schema
npm run db:migrate          # apply migrations to Neon
npm test                    # scoring unit tests
```

See `apps/api/.env.example` and `apps/mobile/.env.example` for required environment variables.
