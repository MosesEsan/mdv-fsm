# Build log — Field Service platform

What has been built, in order, with the decisions taken along the way. The architecture doc ("Field Service Platform — Architecture", Claude Doc) explains how it all fits together; this log says what changed and when.

Code lives in `fsm/` (Mac: `~/Documents/Projects/MesanDigitalVentures/projects/mdv-field-service/fsm`).

## Current state (2026-10-20)

| Area | Status | Where |
| --- | --- | --- |
| Core: tenants, people, roles, token hook, guards | Built | `core_foundation`, `core_guards`, `core_tenant_scoped_keys` |
| Core: tenant settings (per-module, owner-only, live) | Built | `core_tenant_settings`, `src/core/settings` |
| Core: module registry, home screen, feature gates | Built | `src/core/modules` |
| Core: generated files and exports | Built | `core_file_exports`, `src/core/files` |
| Core: platform admin (web, `/admin`) | Built (v1) | `core_platform_admin`, `src/core/admin`, `platform-invite` |
| Core: branding in the app (colours, logo, job titles) | Built | `src/core/branding`, `ThemeProvider` |
| Core: scheduling (bookings, no double-booking, My jobs, job sheet) | Built (same-day bookings) | `core_bookings`, `src/core/scheduling` |
| Core: job photos (shrink, upload queue, private storage) | Built | `core_job_files`, `src/core/jobFiles` |
| Timesheets module | Built (entry, clock, sign-off, reports, CSV/PDF export) | `timesheets_*`, `src/modules/timesheets` |
| Flooring module: viewings and rooms | Built | `flooring_viewings`, `src/modules/flooring` |
| Flooring: customers and enquiries | Not built (next) | |
| Flooring: quote PDF | Not built | |
| Notifications (push, email) | Not built | |

Tests: 154 pgTAP checks, 75 unit tests, typecheck clean (once the photo packages are installed).

## Log

### 2026-10-20 — Documentation pass and a test fix
- **Docs brought up to date:**
  - The architecture doc now covers the code layout, data model, server-side pieces, test counts, local setup, the module how-to and known gaps.
  - This build log is new.
  - The phase-1 plan has a progress section.
  - The repo README has photo packages, admin login, functions, invite emails, test counts and conventions.
  - The stale `app/ROOT_LAYOUT_NOTE.md` was removed.
- **Test fix:** `core_platform_admin` check 7 counted every business, so it failed on a real `db reset` because `seed.sql` adds two demo businesses. It now counts only its own test businesses. The local test run now loads `seed.sql` too, so this kind of slip shows up before it reaches the Mac.

### 2026-10-20 — Viewings and job photos
- **Core job files:** `job_files` table and private `job-files` bucket. Paths are `{tenant}/jobs/{job}/{kind}/{file}`, with thumbnails under `thumbs/`. A file is readable only if its row is. Who can see a job's files: owner and manager, or people booked on the job (`private.can_access_job`). `owner_only` files are for the owner alone (ready for quote PDFs).
- **Photos on the phone:** shrunk before upload (1600 px long side, plus a 400 px thumbnail, JPEG 70%). An upload queue in AsyncStorage retries with waits of 5 s, 30 s, 2 min, then every 10 min, and also on app start, on return to the front, and every minute.
- **Job sheet sections:** `registerJobSection` lets modules add to the core job sheet.
- **Flooring module:** `fl_viewings` (one per job) and `fl_viewing_rooms`. Area = length × width when both are given, otherwise the area typed in. Screens: Viewings list (with a quick "new job"), and a Viewing screen per job. The job sheet shows rooms and total area to booked fitters. No prices.
- **Packages needed:** `npx expo install expo-image-picker expo-image-manipulator`. Camera and photo permission messages are in `app.json`.
- **Decision:** the floor types offered as quick picks are generic (laminate, engineered wood, solid wood, vinyl/LVT, carpet, tiles), and anything else can be typed. Not a per-client setting yet.
- **Known limit:** photos waiting to upload sit in the phone's cache. Move them to app storage before the pilot.

### 2026-10-20 — Navigation fix
- **Fix:** the app crashed with "Maximum update depth exceeded". The cause was each module's `_layout.tsx` rendering `<Stack.Screen options={{ headerShown: false }} />` to hide the parent header. Now `app/(app)/_layout.tsx` hides its header for every route except core screens, and child layouts don't touch it.
- **Rule** (in the architecture doc): never put a `<Stack.Screen options>` in a child layout for the parent's header.

### 2026-10-20 — Scheduling (core)
- **Tables:** `bookings` and `booking_assignees`. An exclusion constraint on person + time range makes double-booking impossible. The time range is copied from the booking by a trigger, never sent by the app.
- **RPCs:** `save_booking` (one step; a clash is refused with SQLSTATE `BK001` and a message naming the person), `cancel_booking`, `booking_clashes`, `booking_job_sheet` (address, customer name and phone, notes, people; no prices).
- **Screens:** week Schedule (owners and managers, filter by person), booking form with live clash warnings and a quick "add job", My jobs (next two weeks), and Job sheet with maps and call buttons. Realtime keeps every device up to date.
- **Switch:** the `scheduling` feature. It is core, because the project rules list bookings as core.
- **Decisions:** bookings are same-day in v1. Times are typed as HH:MM. The week starts on Monday.
- **Open decision:** staff can still read every job in their business (titles and addresses only). Limiting them to booked jobs would stop construction workers choosing other jobs in Timesheets.

### 2026-10-19/20 — Platform admin v1
- **Who can use it:** the platform team only (`platform_admins`, plus a `platform_admin` token claim checked against the table). Every action is a `platform_*` RPC and is logged in `platform_audit`.
- **What it does:** web-only `/admin`. Create a business and edit its details; branding (logo upload, main and accent colours with a contrast check of at least 4.5:1 against white text, name on PDFs); job titles per role; switch modules on or off and set module settings; people (invite by email, change role, deactivate); history.
- **Invites:** the `platform-invite` Edge Function. The email link opens `/set-password`. Locally, `supabase/config.toml` sets `site_url` and the redirect URL. In production, add the real `/set-password` address to the Auth redirect URLs (and optionally set the `INVITE_REDIRECT_URL` secret).
- **Branding in the app:** `useBranding()`, `BrandTheme` and `ThemeProvider`. Buttons and chips use the business's colours, and the home screen shows its logo, name and the person's job title.
- **Fix:** module settings saved by an admin are now checked against the business being edited (`private.settings_tenant_id()`).
- **Decisions taken on "start it":** platform team only; no "view as this business"; clients set primary and accent colours only.
- **Known limit:** a role change reaches the person's app at their next token refresh (up to an hour).
- **Local login:** `admin@platform.test`.

### 2026-10-19 — Modularity refactor, reports and export, architecture doc
- **Shared code moved to core:** dates, files, function calls and Edge helpers moved out of Timesheets.
- **Rule 10:** modules plug in, and the app shell never names a module.
- **Timesheets reports:** hours by person, job or week. CSV and PDF export through the `ts-export` Edge Function, recorded in `file_exports`.
- **Architecture doc:** written as a Claude Doc.

### 2026-10-19 — Settings system and Timesheets module
- **Settings system:** see `settings-and-timesheets-plan.md`.

## Open questions (for us or the client)
1. Should staff see only jobs they're booked on? This conflicts with Timesheets job picking.
2. Multi-day bookings and drag-to-move (Stage 2).
3. Should the floor types offered be a setting each business can change?
4. Who will use the admin besides us? Do we want "view as this business" for support?
5. Each client's delivery option (A, B or C).
6. Offline use beyond the photo queue (PowerSync decision before Stage 2).

## Running it locally (Mac)
```
npx expo install expo-image-picker expo-image-manipulator   # once
npx supabase start
npx supabase db reset            # migrations + seed (Demo Flooring has timesheets, scheduling, flooring on)
npx supabase test db             # 154 checks
npm test                         # 75 tests
npm run seed:users               # demo logins incl. owner@flooring.test, fitter@flooring.test, admin@platform.test
npx supabase functions serve     # ts-export, platform-invite
npx expo start --lan             # phone; add --web for /admin
```
Invite emails: http://localhost:54324.
