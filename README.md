# Field Service app

## Run locally

Prerequisites: Node 22, Docker Desktop, the Supabase CLI, and Expo Go on the test device. The repository includes an `.nvmrc`, so select the supported Node version before installing packages:

```bash
nvm use
npm install
npx expo install --fix
```

Install the photo packages once (camera, photo library, image shrinking):

```bash
npx expo install expo-image-picker expo-image-manipulator expo-print expo-sharing
```

Start Docker Desktop, then start and initialise the local Supabase stack:

```bash
supabase start
cp .env.example .env
supabase status
```

Copy the anon and service-role keys printed by `supabase status` into `.env`. Set `SEED_PASSWORD` to the password you want all local demo accounts to use. When running on a physical phone, replace `127.0.0.1` in `EXPO_PUBLIC_SUPABASE_URL` with the Mac's LAN IP, for example `http://192.168.1.36:54321`; `127.0.0.1` on a phone refers to the phone itself.

Apply all migrations and seed the demo accounts:

```bash
npm run db:reset
npm run seed:users
```

Start Metro and scan its QR code with Expo Go:

```bash
npx expo start --lan
```

If port 8081 is already in use, choose another port:

```bash
npx expo start --lan --port 8082
```

The Mac and phone must be on the same network. Keep Docker, Supabase, and Metro running while using the app.

## Seed users

`npm run seed:users` is safe to run repeatedly on local/dev only. Never run any seed against production. Seed one business with `npm run seed:users -- ag` (or `mdc`, `demo`). All logins use the value of `SEED_PASSWORD`.

Each client business has its own guide covering setup, what the seed creates, the logins for each role, and a test script:

- `docs/clients/ag-property-maintenance.md`: AG Property Maintenance (`*@property.test`)
- `docs/clients/mdc-electrical.md`: MDC Electrical (demo) (`*@mdc.test`)

Other demo logins (`npm run seed:users -- demo`):

- `owner@construction.test`, `manager@construction.test`, `supervisor@construction.test`, `worker1@construction.test`, `worker2@construction.test` (Demo Construction: Timesheets)
- `owner@flooring.test`, `fitter@flooring.test` (Demo Flooring: Timesheets, Scheduling, Flooring)
- `admin@platform.test` (platform admin: open the web build at `/admin`)

## Edge Functions, web admin and invite emails

```bash
npx supabase functions serve      # ts-export, platform-invite
npx expo start --web              # platform admin at http://localhost:8081/admin
```

Invite emails sent from the admin appear in the local mail inbox at http://localhost:54324. The invite link opens `/set-password` (allowed in `supabase/config.toml`). In production, add the real `https://<your-web-app>/set-password` to Auth > URL configuration > Redirect URLs.

## Verification

- `npm run typecheck` — TypeScript check
- `npm test` — unit tests (104 expected)
- `npm run db:reset` — reset and apply migrations/seed
- `npm run db:test` — pgTAP database tests (229 expected)
- `npm run test:acceptance` — verify every seed login, Realtime settings propagation, supervisor assignment scope, and tenant isolation (requires local Supabase and seeded users)
- `npx expo start --lan` — run the Expo Go development server

## Cloud deployment

The complete Supabase, GitHub Actions, Vercel, EAS and store runbook is in `docs/deployment/deploy.md`. Account/payment/dashboard work is consolidated in `docs/deployment/deploy-checklist.md`.

```bash
npm run deploy:supabase -- --env dev --dry-run
npm run build:web
npm run build:ios:preview
npm run build:android:preview
npm run update:preview -- --message "Describe the update"
```

`CLIENT` is mandatory and selects `clients/<client>/config.ts`. For local work use `CLIENT=shared npx expo start`. Never commit secrets or run production deployment/seed commands without explicit approval. Hosted schema, policies, buckets and Realtime are migration-only.

## Documentation

- `docs/clients/*.md` — per-business setup, seeding and role testing.
- `docs/design-development/BUILD-LOG.md` — what has been built, when, and the decisions taken (copy of the project doc `build-log.md`).
- `docs/deployment/deploy.md` — cloud deployment, credentials, builds, store release and rollback.
- `docs/deployment/deploy-checklist.md` — the one ordered checklist for account-holder actions.
- Architecture: the Claude Doc "Field Service Platform — Architecture" (code layout, security model, modules, data model, how to add a module, known gaps).
- Plans in the Claude project: `phase-1-plan-flooring.md`, `platform-admin-plan.md`, `settings-and-timesheets-plan.md`, `deployment-options.md`.

## Conventions (short)

- Every table has `tenant_id`, composite `(tenant_id, …)` keys and RLS; module policies also check `private.feature_enabled('<module>')`.
- Modules plug in through `src/modules/<id>/register.ts`; the app shell never names a module. Core never imports module code.
- Route folders under `app/(app)/` have their own `_layout.tsx` with a `Stack` inside `FeatureGate`. Don't add `<Stack.Screen options>` in a child layout to change the parent header (it causes a render loop).
- Schema changes only through migrations in `supabase/migrations`, each with RLS, indexes and a pgTAP suite.
