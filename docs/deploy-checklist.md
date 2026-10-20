# Cloud launch checklist

This is the single ordered list of steps that require your accounts, payment, secrets or dashboard approval.

- [ ] Decide `<ADMIN_DOMAIN>`, email provider, privacy-policy owner, deletion approach, and which Apple/Google organisation owns the shared app. The shared app identifier is `ie.mesandigital.fsm` on both iOS and Android.
- [ ] Create a private GitHub repo: run `gh repo create <GITHUB_ORG>/<REPO_NAME> --private --source . --push` from the repo root.
- [ ] Supabase Dashboard → New project: `shared-dev` is registered as `pokflcodhocxkwcjriit`; create `shared-prod` in Europe West (Ireland) and paste its ref into `deploy/projects.json`. Production paid plan is recommended for daily backups/no pausing (cost).
- [ ] Copy `deploy/env/.env.example` to `deploy/env/shared-dev.env` and `shared-prod.env`; fill values locally. Do not commit them.
- [ ] GitHub → Settings → Secrets and variables → Actions: add every secret/variable named in `docs/deploy.md`.
- [ ] GitHub → Settings → Environments → New environment → `production`: add required reviewers and limit deployment branches to `main`.
- [ ] Link and deploy dev: inspect `npm run deploy:supabase -- --env dev --dry-run`, then run without `--dry-run`. Do not deploy production yet.
- [ ] Supabase dev → Authentication → Hooks: enable `public.custom_access_token_hook`. Authentication → URL Configuration: set dev admin Site URL and `/set-password` plus `field-service://set-password`. Providers → Email: disable signups. SMTP Settings: paste chosen provider SMTP credentials. Set reviewed JWT expiry.
- [ ] Create the first dev platform admin: export dev URL/service-role key locally and run `npm run admin:create -- --email=<YOUR_EMAIL>`.
- [ ] Vercel → Add New → Project → import the GitHub repo. Framework: Other; build/output come from `vercel.json`. Add Preview dev and Production prod values for `CLIENT`, `EAS_PROJECT_ID`, public Supabase URL and anon key.
- [ ] Vercel → Project → Settings → Domains: add `<ADMIN_DOMAIN>`. Paste `https://<ADMIN_DOMAIN>` and `/set-password` into both hosted Supabase redirect allow-lists as appropriate.
- [ ] Supabase production → Authentication: repeat the hook, URL, invite-only, SMTP and JWT settings. Review the production target, then manually dispatch the `Deploy Supabase` workflow and approve its `production` environment gate.
- [ ] Create production platform admin with `npm run admin:create`; do not run either local seed script against production.
- [ ] Expo/EAS: create the shared EAS project, replace `<EAS_PROJECT_ID_SHARED>`, and set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EAS_PROJECT_ID` in development/preview/production environments. Add `EXPO_TOKEN` to GitHub.
- [ ] Run preview iOS/Android builds. When prompted, let EAS manage certificates, provisioning profiles and Android keystore. Create one APNs key when push notifications are scheduled.
- [ ] Apple Developer: enrol as an organisation (D-U-N-S required; annual cost). App Store Connect → Apps → +: create the app with the final bundle ID. Users and Access → Integrations → App Store Connect API: create a key; store ID, issuer and `.p8` in EAS secrets/placeholders.
- [ ] Google Play Console: pay for/create the developer account (cost), create the app, build the production AAB, and manually upload the first release to Testing → Internal testing. Google Cloud/Play API access: create a service account with release permission; store its JSON as an EAS file secret.
- [ ] Build/submit first releases with the four commands in `docs/deploy.md`. App Store Connect → TestFlight: create an internal group for the platform team and pilot owner. Play Console → Internal testing: add testers.
- [ ] Decide whether to create an invented Review business in production. If yes, approve a dedicated review seeder and reviewer credentials before it is run.
- [ ] Have the privacy-policy owner/counsel publish `<PRIVACY_URL>`, terms, `<SUPPORT_URL>` and `<ACCOUNT_DELETION_URL>`, covering everything in `docs/store/legal-requirements.md`.
- [ ] Capture required iPhone 6.9-inch, iPad 13-inch, Android phone/tablet screenshots from invented Review data. Use the current sizes shown in each console.
- [ ] Replace every DRAFT/placeholder in `store.config.json` and `docs/store/*`; complete App Privacy/Data safety; push iOS metadata with `eas metadata:push` and paste the Play listing in Play Console.
- [ ] Resolve account deletion: ship a public request URL/support workflow at minimum; confirm with Apple whether in-app deletion is required for this invite-only model before review.
