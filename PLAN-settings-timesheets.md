# Plan — Tenant settings + Timesheets module

Status: **core changes approved (2026-10-19). Built: migrations, settings system, Timesheets T0–T2 (no push yet), tests.**
Dropping `site` (logAgainst) and `both` (entryMode) taken as agreed; either can come back as a setting value.
Sources: the settings brief (2026-10-19) and "Timesheets Module — Design & Implementation Plan" (2026-10-18).
Where they conflict I followed the brief for *where settings live and how they're written*, and the design for *how timesheets work*.

## 1. Gaps and conflicts: brief vs design

| # | Topic | Brief | Design | Resolution |
|---|---|---|---|---|
| 1 | Where settings live | `tenants.settings.timesheets`; `features` = on/off only | Everything in `tenants.features.timesheets` incl. `enabled` | **Brief.** Settings in `tenants.settings`. `feature_enabled()` accepts `{"timesheets": true}` or `{"timesheets": {"enabled": true}}`. |
| 2 | Validation | RPC or Edge Function | One Zod schema shared by app and Edge Functions | **SQL RPC** (`update_tenant_settings`) + Zod in app; one shared defaults fixture tested on both sides. Deploys with migrations to every project. |
| 3 | Key style | camelCase | snake_case | **camelCase** (matches TS). |
| 4 | `entryMode` | `start_end \| duration \| clock` | `manual \| clock \| both` | **Brief's values.** "manual" splits into start_end / duration. **`both` dropped:** in clock mode, managers can add manual corrections. Question for clients. |
| 5 | Breaks | `off \| fixed \| manual` + `fixedBreakMinutes` | `default_break_minutes: 30` | **Brief.** Default `off`. |
| 6 | `approval` | `none \| weekly_manager`, default `none` | `none \| manager \| supervisor`, default `manager`; submit step; 5 statuses | **Changed to the design:** `none \| manager \| supervisor`, default `manager`. With `none`, "Submit" approves straight away. |
| 7 | `logAgainst` | `job \| site \| none` | `require_job` (default false); no sites | **Changed:** `job \| none` + `requireJob` (default false). **`site` dropped.** No sites table exists; a construction site should be a core job/project. Question for Gildoc. |
| 8 | Extra design settings | — | week start, rounding, overtime, cost codes, submit day, reminders, location, prefill | **Added now** (behaviour built in this pass): `weekStartsOn`, `roundingMinutes`, `overtimeDailyAfterMinutes`, `overtimeWeeklyAfterMinutes`, `costCodes`. **Deferred** to T4 with their features: `submitDay`, `reminders`, `clockLocation`, `prefillFromBookings`. |
| 9 | Clock entries | Always store a duration | Clock-in creates an open entry with no end | **Separate `ts_clock_sessions` table.** An entry only exists after clock-out, so duration is never null. |
| 10 | Entry shape | `entry_mode` per row | `source manual\|clock\|booking` | **Design's `source`.** One check constraint covers every mode: no times + no break, or both times with duration = span − break. |
| 11 | Duration-only + break | — | Entry has break minutes | Typed hours are **net**; break forced to 0. Question for clients. |
| 12 | Rounding | — | `rounding_minutes` (15) | Stored duration stays **exact**. Rounding (to the nearest step, per entry) is applied in the views only. |
| 13 | Edits after submit | — | Blocked unless manager (logged) | Workers/supervisors: draft and rejected weeks only. Managers can also edit **submitted** weeks (logged in `ts_events`). **Approved/exported weeks must be reopened first.** |
| 14 | Overlap rule | — | Clocked entries only | **All timed entries.** Stricter, same cost. |
| 15 | Timezone | — | "settings or flag block" | **Core column `tenants.timezone`** (default `Europe/Dublin`). |
| 16 | Week start | — | Per tenant | `weekStartsOn` can't change once weeks exist (it would split them). |
| 17 | Missing-timesheet flags | — | In scope | Not in this migration. They need the list of active workers (core); added with the Approvals screen (T2). |
| 18 | `clock_location` column | — | On `ts_entries` | Left out until the GDPR sign-off (design's own risk note). |

## 2. Core changes (small, but touch every tenant)
1. Login-token claim is **`app_role`**, not `role`. Supabase uses `role` itself.
2. Roles: add **`manager`** and **`supervisor`** (design also needs this). Access token hook updated; re-test the flooring tenant.
3. `tenants.settings jsonb not null default '{}'` + `tenants.timezone`.
4. `unique (tenant_id, id)` on `profiles` and `jobs`, so module FKs can't cross tenants.
5. Helpers: `current_tenant_id`, `app_role`, `is_owner`, `is_manager`, `is_supervisor`, `feature_enabled`.

## 3. Migrations
1. `20261019120000_core_tenant_scoped_keys.sql` — helpers, composite keys.
2. `20261019120100_core_tenant_settings.sql` — `tenants.settings` / `timezone`, guard trigger (even owners can't write settings directly), `update_tenant_settings(namespace, value)` (owner only, validated, replaces one namespace), read policy if core has none, Realtime.
3. `20261019120200_timesheets_module.sql` — design's tables with `ts_` prefix: `ts_assignments`, `ts_cost_codes`, `ts_weeks`, `ts_entries`, `ts_events`, plus `ts_clock_sessions`; views `v_ts_daily`, `v_ts_weekly` (normal vs overtime), `v_ts_job_hours`; RPCs `ts_submit_week`, `ts_decide_week`, `ts_reopen_week`, `ts_clock_in/out/cancel`. RLS on every table; every policy checks tenant + feature flag; supervisors see only assigned workers.

**Checked on Postgres 16 with a stub core:**
- worker can't change settings
- bad values, unknown keys and unknown namespaces are rejected
- week start can't change once weeks exist
- duration computed (08:00–16:30 → 510)
- wrong entry method, overlaps, future days and other tenants' jobs are rejected
- a worker can't log for others
- submit locks the week for the worker; manager edits are logged
- reject needs a reason
- supervisor can only approve when approval is `supervisor`, and only their assigned workers
- clock in/out with a fixed 30-min break; workers can't edit clock times
- approved weeks are locked until reopened
- tenant B sees nothing of A
- flag off blocks everything
- the shape constraint holds even with the trigger disabled

## 4. Build status

**Verified here:**
- **pgTAP:** 48/48 on Postgres 16 with a stand-in core.
  - `settings_rls` 13
  - `timesheets_rls` 14
  - `timesheets_rules` 21
- **Unit tests:** 37/37, run through a Node test shim because Vitest couldn't be installed here. They cover:
  - Zod defaults
  - Zod defaults match the SQL defaults (read from the migration)
  - duration per mode
  - summer time
  - week rules
  - entry payloads
- **Type check:** `tsc` is clean against minimal stand-in types for React, React Native, TanStack Query, supabase-js and Expo Router.

**Run in the real repo before merging:**
- `npm run typecheck`
- `npm test`
- `supabase test db`

The test seeds assume the core columns `tenants(id, name, features)` and `profiles(id, tenant_id, full_name, role)`, plus `auth.users`.

**Wiring:** see `app/ROOT_LAYOUT_NOTE.md`:
- import `@/modules` once at start-up
- mount `useTenantSettingsSync()` once
- add `/settings` and `/timesheets` to the navigation

**Stubs to replace with Stage 0 versions if they exist:**
- `src/core/supabase.ts`
- `src/core/auth/useAuthClaims.ts` (move it to a context so there's one subscription)
- `src/core/ui`

**Known gaps:**
- Push on submit/reject (T2 `ts-notify`).
- Missing-timesheet flags.
- Reports and export (T3).
- Supervisor assignment and cost-code admin screens: the tables and RLS exist, the screens don't yet.
- Time inputs are plain `HH:MM` text fields.

## 4a. Code layout (built)
```
src/core/settings/
  registry.ts                 registerModuleSettings(ns, schema, fields); ModuleSettingsMap (declaration merging)
  schema.ts                   buildTenantSettingsSchema() → TenantSettings
  fields.ts                   field metadata (label, description, option labels, showIf)
  api.ts                      fetch + update (RPC)
  useTenantSettings.ts        TanStack Query + Zod parse; Realtime on tenants row + refetch on focus
  useModuleSettings.ts        typed per namespace
  useUpdateTenantSettings.ts  owner only; optimistic, rollback, invalidate
  SettingsScreen.tsx          groups by enabled modules, renders from metadata
src/modules/timesheets/         (design's layout)
  schemas/   settings.ts (+ settings.defaults.json), entry.ts, week.ts
  services/  duration.ts, rounding.ts, weekDates.ts   (pure, unit-tested)
  api/       hooks: useMyWeek, useDay, useSaveEntry, useDeleteEntry, useClock, useSubmitWeek,
             useApprovals, useDecideWeek, useReopenWeek
  components/ EntryForm → StartEndFields | DurationFields | ClockPanel; BreakField; JobPicker;
             DayRow, EntryCard, StatusBadge, WeekPicker
  screens/   MyWeek, Day, EntryForm, Approvals, WeekReview   (thin)
  routes.ts  registered only when the flag is on
src/modules/index.ts            composition root (outside core)
supabase/tests/                 pgTAP: settings RLS, timesheets RLS, cross-tenant, week locks, defaults fixture
```
This pass covers design stages T0 + T1 + T2 (without push). Still to come: T2 push (`ts-notify`), T3 reports/export, T4 options.

## 5. Cost / complexity flags
- **Clock mode:** forgotten clock-outs and corrections; location stamping needs GDPR work.
- **Offline:** clock-in or saving on a site with no signal fails in Phase 1. Decide on PowerSync before T1 if it's common.
- **Supervisor approval** adds assignment admin for the owner. Default stays `manager`.
- **Core role change** touches the token hook for every tenant.

## 6. Open questions (plain English, for clients)
1. Do staff write start and finish times, just total hours, or tap in and out on the phone? Would you ever want both?
2. Are breaks taken off automatically, entered by each person, or not tracked? Should an automatic break apply on short days?
3. When someone types total hours, is that already after their break?
4. Should hours always be linked to a job? For Gildoc: is each site one job, or do you need a separate list of sites?
5. Who signs off timesheets: you, or a foreman for their own crew? Can a foreman fill in hours for their crew?
6. Once a week is sent in, should the office be able to fix it without sending it back?
7. What day does your week start, and when must timesheets be in?
8. Do you round hours (e.g. nearest quarter hour)? Per entry or per day?
9. How do you count overtime: after a set number of hours a day, a week, or not at all?
10. Do staff often work where there's no phone signal?
