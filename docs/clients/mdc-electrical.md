# MDC Electrical — setup, seeding and testing

Martin's electrical business. He, his apprentice and an accounts person log visits to customers (mostly hotels). At month end there's a report per customer to invoice from. It's the Timesheets module set up for customer visits, so there's nothing new to install. There are no prices, invoices, stock, photos, jobs or clocking in and out.

| | |
| --- | --- |
| Business id | `00000000-0000-0000-0000-000000000004` ("MDC Electrical (demo)") |
| Switched on | `timesheets` |
| Timesheets settings | start and finish times, breaks off, sign-off none, log against customer, materials optional, week starts Monday, no rounding, no overtime (assumptions until Martin confirms) |
| Job titles | Owner, Apprentice (role `worker`), Accounts Administrator (role `viewer`, read only) |
| Branding | Placeholder: main `#1F6F8B`, accent `#0F3D4C`, no logo yet |
| App opens on | Today, with tabs: Today · Entries · Report · Settings. Accounts opens on Entries |
| Client docs | "MDC Electrical — Discovery Notes", "MDC Electrical — Timesheet App Proposal and Trial", "MDC Electrical — Internal Delivery Plan" (Claude Docs) |

## 1. Set up locally

Follow "Run locally" in the main `README.md` first. Then:

```bash
npm run db:reset                 # migrations + every SQL seed (supabase/seeds/*.sql)
npm run seed:users -- mdc        # MDC logins and 9 sample visits
npx supabase functions serve     # ts-export (PDF and CSV of the monthly report)
npx expo start --lan             # phone (Expo Go)
npx expo start --web             # office view in the browser (report, print)
```

`seed:users -- mdc` is safe to run again. It puts the sample visits back the way they were.

## 2. What the seed creates

| File | What it adds |
| --- | --- |
| `supabase/seeds/20_mdc-electrical.sql` | The business, its Timesheets settings, job titles, placeholder colours, 4 customers: Harbourside Hotel, The Granary Hotel, Oakfield Nursing Home, Brennan's Bar |
| `scripts/seed/mdc.ts` | 3 logins and 9 visits from 2 to 20 October 2026 with materials, the same as the flows board |

## 3. Logins

Every password is the value of `SEED_PASSWORD`.

| Email | Person | Role | What they can do |
| --- | --- | --- | --- |
| `owner@mdc.test` | Martin | Owner | Log visits; see everyone's; filter by person and customer; correct or delete anyone's visit (it then shows "Corrected by Martin"); monthly report with PDF, CSV and Print; Settings |
| `jack@mdc.test` | Jack | Apprentice (`worker`) | Log visits; see, edit and delete only his own; no Report tab |
| `accounts@mdc.test` | Michael (placeholder name) | Accounts Administrator (`viewer`) | See every visit and the report; download PDF and CSV; print. Can't add, change or delete anything (the database refuses it) |

## 4. Acceptance workflow

This is the V1 "done" check. Use a phone for steps 1–3 and a browser for steps 4–6.

1. **Log a visit on a phone.** Sign in as `jack@mdc.test` and tap "Log a visit". Pick Harbourside Hotel, Today, 09:00–11:30, work done "Replaced 4 emergency lights", and materials "Emergency light × 4 each" and "1.5mm cable × 6.5 m". Save.
   - Also check the problem messages: no customer; finish before start; over 16 hours; empty work done; 1.5 "each"; 0 quantity; 1.234 m.
2. **Refresh.** Pull to refresh or close and reopen the app. The visit is still on Today and in Entries.
3. **The owner corrects it.** Sign in as `owner@mdc.test`, go to Entries, filter to Jack, open the visit and tap Correct. Change the finish to 11:00 and save. It shows "Corrected by Martin". As Jack, it shows the same.
4. **Find it in the report.** In the browser, as Martin or `accounts@mdc.test`, go to Report and pick Harbourside Hotel and October 2026. The visit is a line with 2.00 h and "Corrected by Martin", and the totals include it.
5. **Export.** Tap Download PDF: it's A4 with headings on each page, no visit split across pages, page numbers, and totals for each person and for materials. Then tap Download CSV: there's one line per visit.
6. **Print.** Tap Print. The PDF opens in a new tab; print from there.

**Accounts is read only:** as `accounts@mdc.test` there are no Log, Edit, Correct or Delete buttons. `supabase/tests/core_viewer_role.test.sql` proves the database refuses those changes even if they're tried directly.

## 5. Automated tests

```bash
npm run typecheck
npm test
npm run db:test       # or scripts/db-harness/run.sh . where Docker isn't available
```

| Area | Database tests | Unit tests |
| --- | --- | --- |
| Settings, customer visits, materials, Corrected by | `timesheets_visits.test.sql` | `schemas/settings`, `visit.test.ts`, `visitRules.test.ts` |
| Read-only accounts role | `core_viewer_role.test.sql` | `core/team` rules |
| Monthly report and export | `timesheets_customer_report.test.sql` | `supabase/functions/ts-export/customerReport.test.ts` |

## 6. Setting up the real business (trial)

Do this on the hosted project only, with approval. Never run the seed scripts there.

1. Platform admin (web `/admin`): add the business "MDC Electrical" and switch on Timesheets.
2. Settings, Timesheets:
   - Link hours to: A customer
   - Materials used: Staff can add them
   - Who signs off: No sign-off
   - Round hours: No rounding
   - Overtime: no limits
3. Branding: job titles worker = "Apprentice" and viewer = "Accounts Administrator". Add the logo and colours once Martin sends them.
4. Customers: import his list, or let them be added as visits are logged.
5. Invite Martin as Owner. Invite the apprentice as Worker and accounts as View only, from Team or the admin.
6. Deploy `ts-export` and the web dashboard (Vercel) for the office report. See `docs/deploy.md`.

## 7. Open questions

These are with Martin; don't build around them yet:
- His father's real name (the demo uses "Michael").
- The report header: logo, VAT number, order number.
- Units beyond each and metres.
- Locking a month once it's invoiced.
- Working with no signal (visits can't be saved offline yet).
- Delivery option A, B or C.
- Whether "Corrected by" is enough, or the visit should show what changed.
