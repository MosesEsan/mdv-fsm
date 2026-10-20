# Cloud deployment runbook

## Environments and boundaries

Supabase projects are created in `eu-west-1` (Ireland). `shared-dev` may use the free plan. `shared-prod` should use a paid plan for daily backups and to avoid project pausing; this costs money. Dedicated client projects are added to `deploy/projects.json` and follow the same scripts. Production never receives `supabase/seed.sql` or `scripts/seed-users.ts`.

The Expo app uses one codebase. `CLIENT` selects `clients/<client>/config.ts`; tenant branding and feature flags provide runtime differences. The shared app has one EAS project. Every white-label store app gets its own EAS project and belongs in the client’s Apple and Google organisation accounts, with our team invited as developers (Apple guideline 4.2.6).

## Accounts

- Private GitHub repository with Actions enabled.
- Two Supabase projects in Ireland: shared dev and shared production.
- Vercel project and `<ADMIN_DOMAIN>`.
- Expo/EAS organisation and one shared-app EAS project.
- Apple Developer Program organisation account, App Store Connect app and API key. Organisation enrolment needs a D-U-N-S number and has an annual cost.
- Google Play developer account, app record and service account. Registration has a cost. The first Android build must be uploaded manually to internal testing before API submission works.

Create and push the private repository yourself:

```bash
gh repo create <GITHUB_ORG>/<REPO_NAME> --private --source . --push
```

## Secret and variable names

Never paste values into Git. GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_SHARED_DEV_DB_PASSWORD`
- `SUPABASE_SHARED_DEV_SERVICE_ROLE_KEY`
- `SUPABASE_SHARED_PROD_DB_PASSWORD`
- `SUPABASE_SHARED_PROD_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` after choosing a provider
- `EXPO_TOKEN`

GitHub Actions variables:

- `SUPABASE_SHARED_DEV_INVITE_REDIRECT_URL`
- `SUPABASE_SHARED_PROD_INVITE_REDIRECT_URL`

Local target files (gitignored) use the names in `deploy/env/.env.example`. Supabase Edge Functions also receive the platform-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`; custom code currently reads `INVITE_REDIRECT_URL`. Both candidate provider key names are reserved for the future mail integration.

EAS environments `development`, `preview` and `production` need `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EAS_PROJECT_ID`. Store submission uses the App Store Connect key ID/issuer/key file and an Android service-account JSON as EAS secrets; never commit `.p8` or JSON credentials.

Vercel Preview points to Supabase dev and Production points to Supabase prod. Set `CLIENT=shared`, `EAS_PROJECT_ID`, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in each environment.

## Supabase provisioning and deploy

Create both projects in `eu-west-1`, replace the refs in `deploy/projects.json`, and copy `deploy/env/.env.example` to one gitignored file per target. Preview commands before any mutation:

```bash
npm run deploy:supabase -- --env dev --dry-run
npm run deploy:supabase -- --name shared-prod --dry-run --yes-prod
```

After explicitly linking dev, deploy it with:

```bash
npm run deploy:supabase -- --env dev
```

Production is intentionally refused without both a production target and `--yes-prod`:

```bash
npm run deploy:supabase -- --env prod --yes-prod
```

The script links each project, pushes migrations, discovers and deploys every Edge Function except `_shared`, and applies its secrets file. Migrations create `job-files`, `exports` and `branding`, add required Realtime tables, and grant the custom access-token hook to `supabase_auth_admin`. Never edit hosted schema, policies, buckets or Realtime in the dashboard.

After migrations, create the first platform admin against the chosen project (service role in the shell only):

```bash
npm run admin:create -- --email=admin@example.com
```

For production review data, create a separate, optional review seeder only after the invented dataset and credentials are approved. Never run the local seed scripts against production.

## Hosted Auth settings

These are project configuration, not schema. In Supabase Dashboard → Authentication:

- Hooks: enable the custom access-token hook `public.custom_access_token_hook`, matching local `config.toml`.
- URL Configuration: set Site URL to `https://<ADMIN_DOMAIN>`; add `https://<ADMIN_DOMAIN>/set-password` and `field-service://set-password`. Add a white-label scheme only for an approved app.
- Providers → Email: disable new email signups (invite only); preserve the present email-confirmation behaviour.
- SMTP: configure the chosen Resend or Postmark SMTP credentials so invites do not depend on the built-in rate limit.
- Sessions/JWT: use a reviewed JWT expiry (initial recommendation: 3600 seconds). Role changes reach an already signed-in user at their next token refresh.

## CI and production approval

`ci.yml` installs deterministically, typechecks, runs unit tests, starts and resets local Supabase, runs pgTAP, and exports web. Pushes to `main` deploy all dev targets. Manual `Deploy Supabase` runs production under the GitHub `production` environment. In GitHub → Settings → Environments → production, add required reviewers before storing production secrets.

## Web admin on Vercel

`npm run build:web` exports the Expo Router single-page app to `dist`. `vercel.json` rewrites deep links to `index.html`, disables caching for the shell and sets CSP, anti-framing, referrer, HSTS and MIME-sniffing headers. The root router gates `/admin` on the signed `platform_admin` claim, and `app/admin/_layout.tsx` prevents a phone-native admin UI. `/set-password` uses Supabase’s URL session handling and must be allow-listed as described above.

Connect the private GitHub repo in Vercel, set environment variables, deploy Preview first, then attach `<ADMIN_DOMAIN>` and promote Production. If the final Supabase hostname is known, narrow the CSP wildcard to those exact dev/prod origins.

## EAS builds, credentials and updates

Replace bundle/project placeholders before running EAS. Let EAS manage iOS certificates/profiles and the Android keystore. Create one APNs key when push work begins (it is not implemented yet). Commands:

```bash
npm run build:ios:preview
npm run build:android:preview
npm run build:prod
npm run submit:ios
npm run submit:android
npm run update:preview -- --message "<MESSAGE>"
npm run update:prod -- --message "<MESSAGE>"
```

OTA channels are `preview` and `production`; runtime compatibility follows the native app version. First store runs:

```bash
eas build -p ios --profile production-shared
eas submit -p ios --latest
eas build -p android --profile production-shared
eas submit -p android --latest
```

Create a TestFlight internal group for the platform team and pilot owner. For Play, manually upload the first AAB to Internal testing, then allow service-account submissions to the `internal` track.

## Store submission

Review and replace every DRAFT/placeholder in `store.config.json`, then use `eas metadata:push`. Complete privacy answers from `docs/store/app-privacy.md`, Play listing/data safety, screenshots and counsel-approved privacy policy/terms. The smallest deletion option is a public request page or support workflow handled by a platform admin; the final approach remains an open decision.

## Dedicated client project

1. Create the Supabase project in Ireland and add a `dedicated` target to `deploy/projects.json`.
2. Create its gitignored target env file and GitHub secrets.
3. Copy `clients/demo-whitelabel`, replace identifiers/assets/locked tenant ID, and add an EAS profile with that `CLIENT`.
4. Create a separate EAS project and set its environment variables.
5. Configure Auth URLs/SMTP/hook and deploy with `--name` (plus `--yes-prod` if production).
6. Build under the client’s Apple/Google organisation accounts.

## Rollback

- Web: use Vercel Deployments → select the last known-good deployment → Redeploy/Promote.
- OTA: inspect update groups, then run `eas update:republish --group <KNOWN_GOOD_GROUP_ID> --channel <CHANNEL>`.
- Database: never edit an applied migration. Write and test a new forward migration that reverses the safe part of the change, then deploy it through the same approval path.
- Edge Function: check out the known-good commit and deploy that function again.
