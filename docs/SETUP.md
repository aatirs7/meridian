# Meridian — Setup

Everything in this repo is built and typechecks; what's left is wiring up the
three external services and the two accounts. Do these once.

## 0. Install

```bash
npm install
```

A root `.npmrc` sets `legacy-peer-deps=true` so the Expo/RN peer ranges resolve
cleanly across the workspace.

## 1. Neon (database)

1. Create a project at https://neon.tech.
2. Copy the pooled connection string into `apps/api/.env.local` as `DATABASE_URL`
   (see `apps/api/.env.example`).
3. Apply the schema:
   ```bash
   npm run db:migrate          # runs drizzle-kit migrate against DATABASE_URL
   ```
   The migration in `apps/api/drizzle/0000_init.sql` creates all seven tables.

## 2. Auth — Sign in with Apple (no third-party service)

Auth is native Apple sign-in verified by the API; there's no Clerk or other
provider. Setup is just Apple Developer config + one secret.

1. In the **Apple Developer** portal → Identifiers → your App ID
   (`com.elysiumventures.meridian`), enable the **Sign in with Apple**
   capability. (No web "Services ID" is needed — that's only for the web OAuth
   flow we're not using.) EAS adds the matching entitlement from
   `usesAppleSignIn: true` in `app.json`.
2. Generate a session signing secret and put it in `apps/api/.env.local` as
   `SESSION_JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Confirm `APPLE_BUNDLE_ID` in `apps/api/.env.local` matches the iOS bundle id
   (`com.elysiumventures.meridian`) — it's what the API checks the Apple token
   was issued for.

The allowlist is enforced entirely by the API: on first sign-in each person
must pick **"Share My Email"** so their email can be matched against
`ALLOWED_EMAILS` (step 3). After that we store their Apple id and never need the
email again. How it flows: the app gets an Apple identity token →
`POST /api/auth/apple` verifies it against Apple's public keys, checks the
allowlist, and returns a signed Meridian session token → the app sends that as
the Bearer on every request (verified networklessly, no DB hit).

## 3. The two-user config

Fill these in `apps/api/.env.local` (and later in Vercel's env):

```
ALLOWED_EMAILS="you@example.com,bro@example.com"
USER_A_EMAIL="you@example.com"      # A is the fixed first column in daily_results
USER_B_EMAIL="bro@example.com"
USER_NAMES='{"you@example.com":"Aatir","bro@example.com":"Bro"}'
APP_TIMEZONE="America/New_York"
CRON_SECRET="<random string>"
ENABLE_NEUTRAL_DAYS="false"
```

Use the real Apple emails you'll sign in with (and "Share My Email" on first
sign-in). A/B is just which column each of you occupies in the daily record; it
has no "player 1" meaning. Pick either.

## 4. Run locally

```bash
npm run api        # Next.js API at http://localhost:3000  (GET /api/health to verify)
npm run mobile     # Expo dev server
```

On a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your
machine's LAN IP (e.g. `http://192.168.1.20:3000`), not `localhost`.

## 5. Deploy the API (Vercel)

1. New Vercel project, **root directory = `apps/api`**.
2. Add every var from step 3 plus `DATABASE_URL`, `SESSION_JWT_SECRET`, and
   `APPLE_BUNDLE_ID` to the project's environment.
3. Deploy. `apps/api/vercel.json` registers the daily finalize cron; Vercel
   signs cron requests with `CRON_SECRET` automatically.
4. Point the mobile build profiles at the deployed URL in `apps/mobile/eas.json`
   (replace the `EXPO_PUBLIC_API_URL` placeholders).

## 6. Ship to TestFlight (EAS)

```bash
cd apps/mobile
eas init                       # creates the project; paste the id into app.json extra.eas.projectId
eas build --profile preview --platform ios
eas submit --profile production --platform ios   # or upload the build to TestFlight
```

## 7. Shipping changes — OTA update by default, build only when forced

**Default workflow: every feature/change ships as an EAS Update (over-the-air),
not a new build.** An OTA update pushes the new JS bundle + assets to the app
already installed on both phones, no TestFlight round-trip. New builds are slow
and only needed when something *native* changes.

```bash
cd apps/mobile
npm run update -- "what changed"      # = eas update --channel production --message "what changed"
```

The installed app picks it up on next launch (runtimeVersion policy is
`appVersion`, so a JS-only update stays compatible without a version bump).

**A new build (`npm run build:ios`) is required only when native changes —**
do this when, and only when, the change touches one of these (otherwise OTA):

- A new dependency with native code, or an Expo SDK upgrade.
- `app.json` native config: plugins, permissions/entitlements (e.g.
  `usesAppleSignIn`), bundle id, scheme, **app icon or splash**, `newArchEnabled`.
- A `runtimeVersion` / app `version` bump.

Pure JS/TS, React components, styling, business logic, API-client changes →
**always OTA**. When a change does require a build, that will be called out
explicitly and you decide before one is cut.

## Verifying it works (two devices)

1. Both of you sign in with Apple. A third Apple account should be rejected
   ("Not on the list").
2. Each builds a list under the gear → manage.
3. Check items off; within ~30s each of you sees the other's progress and the
   live standing on Today.
4. After midnight ET (or seed past-dated check-ins directly in the DB), open the
   app — the Tally tab shows exactly one finalized row per past day, and
   re-opening never changes a finalized row.

## What's where

- Scoring + dates + API types: `packages/shared/src` (18 unit tests:
  `npm test`).
- Finalization (the idempotent day-freezer): `apps/api/lib/finalize.ts`.
- Auth (Apple verify, session mint, allowlist + A/B): `apps/api/lib/auth/`.
- Client provider stack: `apps/mobile/app/_layout.tsx`.
