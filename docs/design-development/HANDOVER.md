# Handover — Field Service platform

Read this first in any new session (cloud or local). It says what the product is, who it's for, how the code is organised, how to work in it, and what's next. Last updated 2026-10-20.

Also read: `docs/clients/*.md` (per-business setup, seeding, test logins), `AGENTS.md` (repo workflow, cloud commands), `README.md` (local setup), `docs/BUILD-LOG.md` (what was built, in order), `docs/deploy.md` + `docs/deploy-checklist.md` (cloud runbook).

## 1. The product

One multi-tenant field-service / job-management app (Expo React Native + Supabase), built once and configured per client business with feature flags. Clients get either the shared app (a tenant) or later a white-label build of the same code.

- **Core** (every business): tenants, people and roles, branding, customers, jobs, job records (people on a job, updates feed, photos by stage), job files, scheduling (bookings, no double-booking), settings, platform admin (web, `/admin`).
- **Modules** (switched on per business in `tenants.features`): `flooring` (enquiries, viewings, quotes, price list), `timesheets`, `extra_work`.
- Rule: modules plug in through registries (`registerModule`, `registerJobSection`, `registerJobListAddon`, `registerJobAction`, `registerUploadHook`, `registerGettingStarted`, `registerHomeCard`). Core never names a module.

## 2. Clients

| Client | Who | Status | Modules | Notes |
| --- | --- | --- | --- | --- |
| **AG Property Maintenance** | Arnis Gelsons (owner). Property maintenance and bathroom renovations, ~5 people | **Main focus.** Demo being prepared | `job_records` (core), `extra_work` | Replaces a WhatsApp group. Wants a monthly price, no big upfront cost. We already maintain his website. Demo as *our product*, then ask what's missing |
| **Artisan Flooring** | Milen. Floor fitting, sanding, restoration | Stage 1 built (enquiries, viewings, quotes, schedule, job sheet) | `flooring`, `scheduling` | Requirements still being gathered for a proposal. Seeded as "Demo Flooring" |
| **Gildoc** | Irish construction company (Liam Doherty, Emer, Fiona) | Discovery | Likely `timesheets`, site reports, documents | Requirements not confirmed |
| **MDC Electrical** | Martin | V1 being built (see BUILD-LOG) | `timesheets` set up for customer visits | Visits per customer, materials, monthly customer report; read-only accounts role. Docs: proposal and internal plan |

Seeded demo businesses: `00000000-0000-0000-0000-000000000001` Demo Flooring, `...0002` construction (timesheets), `...0003` **AG Property Maintenance**, `...0004` **MDC Electrical (demo)** (`owner@mdc.test`, `jack@mdc.test`, `accounts@mdc.test`).

## 3. Stack and environments

- Expo SDK 57, Expo Router, TypeScript, TanStack Query, Zod, `@expo/vector-icons` (Ionicons).
- Supabase: Postgres + RLS on every table, Auth with a custom access token hook (`tenant_id`, `app_role` in the JWT), Storage (private buckets `job-files`, `branding`, `exports`), Realtime, Edge Functions (`platform-invite`, `ts-export`).
- Region: eu-west-1 (Ireland).
- **Hosted dev project:** `shared-dev`, ref `pokflcodhocxkwcjriit` (`deploy/projects.json`), deployed (Oct 2026). Re-deploy after new migrations or functions: `npm run deploy:supabase -- --env dev`. Prod (`shared-prod`) not created.
- **Accounts in place:** Supabase organisation, Apple Developer (App Store), Google Play Console.
- Local: `.env` currently points at a Mac on the LAN (`http://192.168.1.36:54321`). Switch to `https://pokflcodhocxkwcjriit.supabase.co` + hosted anon key once dev is deployed.

## 4. Code map

```
app/                         Expo Router routes (thin wrappers around screens)
  (auth)/login, set-password
  (app)/(tabs)/              bottom tabs (Expo Router Tabs): index (Home), jobs/, customers/, extra-work/, visits, visit-entries, visit-report, settings
  (app)/                     opens over the tabs: team/, visit/, schedule/, my-jobs/, flooring/, timesheets/
  admin/                     web platform admin
src/core/
  ui/index.tsx               primitives: Screen, Card, Button (variants, sizes, icon), Chip, TextField, Notice, Title
  ui/kit.tsx                 board pieces: AppBar, Pill, ListRow, PhotoGrid, PhotoViewer, Sheet, EmptyBox, LoadingCards, LoadFailed, Avatar
  auth/                      AuthProvider, LoginScreen, SetPasswordScreen, passwordRules
  branding/                  useBranding, BrandTheme, BrandMark
  modules/                   registry (nav items: icon, useCount, startHere), home.ts registries, HomeScreen, FeatureGate
  jobRecords/                api, hooks, rules, screens (Jobs, Job, JobEdit, PostUpdate), home.ts
  jobFiles/                  photo pick/shrink, upload queue (AsyncStorage, retries), choosePhotoSource
  jobs/sections.ts           job page sections, list add-ons, job actions
  scheduling/, customers/, settings/, admin/, dates/
src/modules/
  extraWork/, flooring/, timesheets/   each with register.ts, api, hooks, rules, screens, home.ts
supabase/migrations/         schema (never edit by hand in the dashboard)
supabase/tests/              pgTAP (229 checks)
supabase/seeds/              one SQL seed per demo business (local/dev only): 00 flooring+construction, 10 AG, 20 MDC
scripts/seed-users.ts        runs scripts/seed/{demo,ag,mdc}.ts: logins and data needing them (npm run seed:users -- ag|mdc|demo)
scripts/demo-photos/         labelled placeholder photos (swap for real ones, same names)
scripts/demo-branding/       AG logo
scripts/db-harness/          run pgTAP without Docker (Postgres 16 + pgTAP + stub.sql)
design/flows-board/          the interactive flows board (source + build)
```

## 5. How to work here

- Lead with the answer; plain English for anything client-facing; no jargon.
- Schema changes only as new migrations; every new table gets RLS, policies, indexes and pgTAP tests.
- Prices never reach field roles (RLS, not just UI). Job records and extra work have no prices at all.
- Business logic in hooks/services/rules; screens stay small; pure rules get unit tests (`__tests__/`, vitest).
- Before committing code: `npm run typecheck` (or `npx tsc --noEmit`), `npm test`, `npx supabase test db` (or `scripts/db-harness/run.sh <repo>` where Docker isn't available).
- Conventional Commits, small groups. Never commit env files or keys. Never seed production.
- Keep docs current as work happens: `docs/BUILD-LOG.md`, this handover, and the flows board.
- When a choice isn't decided by the client, take the option with the least admin for them, mark it as an assumption, and add a question.

### The flows board

`design/flows-board/` holds the interactive design board (every screen as clickable flows, plus a design guide). Published at the "Field Service flows" artifact.

- `clients/fieldservice.js` = all screens, flows and journeys (flooring, timesheets, admin, job records). Edit it, then:
  `python3 design/flows-board/build.py design/flows-board/clients/fieldservice.js /tmp/field-service-flows.html "Field Service flows" "Every screen of the app, grouped by user flow. Phones, tablets and the admin are interactive."`
- Check: `node design/flows-board/harness.js /tmp/field-service-flows.html` (Playwright; clicks every flow; must report no errors).
- Job records flows render with the AG/demo business through `brandMap`; their screens live in the `JR` namespace inside `fieldservice.js`.
- `clients/artisan-flooring.js`: a separate board for Artisan Flooring, built but never published.
- Board still says "Demo Property Care" for job records, and lacks the "Edit details" link: update both.

## 6. AG Property Maintenance — current state

**Built and committed:** database (job records, extra work), mobile screens matched to the board (jobs list opens first, job page, new/edit job, post update, extra work log/entry/office list), branded sign in / set password / home, AG demo data with his logo and colours (`#1973B3`, `#13406C`), owner Arnis Gelsons (`owner@property.test`), workers `manager@`, `adam@`, `kasia@`, `dean@property.test` (password = `SEED_PASSWORD`).

**Since then:** bottom tabs (Jobs, Customers, Extra work, Settings), Customers list and page, Settings with Sign out, and Team (owner invites and manages people from the phone; `team-invite` function).

**Not yet verified on a phone.** The seed (photos, logo upload) has never run end to end.

**Left before the demo:**
1. Run the seed and test on a phone; fix what it finds.
2. Decide: should a whole update wait and send itself with no signal (today only photos do)?
3. Real before/after photos in `scripts/demo-photos/` (same file names).
4. Optional: real staff names; search covering extra-work text.
5. Update the flows board to AG and add "Edit details".
6. Deploy the hosted dev project and point the app at it (section 3).

**To do (agreed 2026-10-21):**
- [ ] Offline updates: decide, then queue the whole update (text and photos) to send when signal returns, or leave it out of the demo.
- [ ] Flows board: AG name, bottom tabs, Customers, Team, Settings, Edit details, "Add to invoice"; republish.
- [ ] Push notifications (core): store push tokens, send from an Edge Function on job assigned, new update and extra work; per-person settings; needs a test build.

**Documents (Claude Docs):** "AG Property Maintenance — Job App Proposal and Trial" (client-facing: demo script, 4-week free trial, proposed €149 + VAT/month up to 6 users, questions) and "AG Property Maintenance — Internal Delivery Plan" (status, trial setup, cost list, pricing, risks). Hourly rate and support hours in the cost list are placeholders.

## 6b. MDC Electrical — current state

**Built and committed (not yet run on a device):** Timesheets set up for customer visits: settings (`logAgainst: customer`, `materials: optional`), materials per visit, visits per customer, "Corrected by", read-only `viewer` role (Accounts Administrator), customer × month report with PDF/CSV export, and the screens (Today, Log a visit, Entries, Visit, Monthly report). Demo business seeded by `supabase/seeds/20_mdc-electrical.sql` + `npm run seed:users -- mdc` (`owner@mdc.test`, `jack@mdc.test`, `accounts@mdc.test`).

**Left:** run the acceptance workflow on a phone and the web (log a visit, refresh, owner corrects, find it in the report, PDF, CSV, print) and fix what it finds; deploy `ts-export`; settle the price (Docs: "MDC Electrical — Timesheet App Proposal and Trial", "MDC Electrical — Internal Delivery Plan"). Open with Martin: his father's name, report header, units beyond each/metres, month locking, no signal, delivery option.

## 7. Open questions (all clients)

- AG: offline updates; real staff count; manager permissions; customer photo pack; invoicing software name; final price after the trial.
- Flooring: VAT and invoices; should managers see prices; viewings on the schedule; multi-day bookings.
- Platform: staff seeing only their jobs vs Timesheets job picking; prod Supabase plan (paid, cost); email provider; privacy policy and account deletion; which Apple/Google accounts own the shared app.
- Remembering the business on the sign-in screen (today it shows the app name before sign-in).
