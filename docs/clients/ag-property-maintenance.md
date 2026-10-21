# AG Property Maintenance — setup, seeding and testing

Arnis Gelsons' property maintenance and bathroom renovation business (about 5 people). It replaces their WhatsApp group: one record per job with instructions, who's on it, updates, photos by stage and extra work. There are no prices anywhere in the app.

| | |
| --- | --- |
| Business id | `00000000-0000-0000-0000-000000000003` |
| Switched on | `job_records` (core), `extra_work` |
| Branding | Logo `scripts/demo-branding/ag-logo.png`, main `#1973B3`, accent `#13406C` |
| App opens on | Jobs list, with tabs: Jobs · Customers · Extra work · Settings |
| Client docs | "AG Property Maintenance — Job App Proposal and Trial", "AG Property Maintenance — Internal Delivery Plan" (Claude Docs) |

## 1. Set up locally

Follow "Run locally" in the main `README.md` first (Docker, Supabase CLI, `.env` with `SEED_PASSWORD`). Then:

```bash
npm run db:reset                 # migrations + every SQL seed (supabase/seeds/*.sql)
npm run seed:users -- ag         # AG logins, assignments, updates, extra work, photos, logo
npx supabase functions serve     # team-invite (invites from the Team screen)
npx expo start --lan             # scan with Expo Go
```

`seed:users -- ag` is safe to run again. It only seeds AG. Run `npm run seed:users` with no name to seed every demo business.

## 2. What the seed creates

| File | What it adds |
| --- | --- |
| `supabase/seeds/10_ag-property.sql` | The business, its features and branding, 8 customers, 8 jobs (4 active, 4 completed with real finish dates) |
| `scripts/seed/ag.ts` | 5 logins, who's on each job, 10 updates, 3 extra-work entries (1 already added to the invoice), 23 photos (before, progress, completion) and the logo upload |

The photos are labelled placeholders in `scripts/demo-photos/`. To use real ones, replace the files and keep the same names, including the `.thumb.jpg` versions.

## 3. Logins

Every password is the value of `SEED_PASSWORD`.

| Email | Person | Role | What to check |
| --- | --- | --- | --- |
| `owner@property.test` | Arnis Gelsons | Owner | Every job; New job; Edit details; who's on it; Customers; extra work flagged red until "Add to invoice"; Team (invite, change role, turn access off); Settings |
| `manager@property.test` | Gary Nolan | Manager | Same as the owner except Team |
| `adam@property.test` | Adam Byrne | Worker | Only jobs 1, 5 and 8; post an update with photos; log extra work; no Customers tab and no "Add to invoice" |
| `kasia@property.test` | Kasia Nowak | Worker | Jobs 1, 3 and 6 |
| `dean@property.test` | Dean Fox | Worker | Jobs 2 and 7 |

## 4. Test script (about 15 minutes)

1. **Owner: jobs list.** Sign in as `owner@property.test`. The app opens on Jobs with AG's logo and colours. "Bathroom renovation, 14 Main Street" shows a red extra-work tag.
2. **Owner: job page.** Open it and check the instructions, the people, the photos by stage, the updates and the extra work.
3. **Worker: update.** On a second phone (or after signing out), sign in as `adam@property.test`. Only his jobs show. Post an update with a photo on job 1.
4. **Owner: sees it.** Back as the owner, the update appears on job 1 with Adam's name and the time.
5. **Worker: extra work.** As Adam, use "Log extra work" on job 1 and add what, why, hours and a photo.
6. **Owner: invoice.** As the owner, open Extra work and tap "Add to invoice". The red tag goes.
7. **Finish a job.** Mark job 1 completed and check the warning about missing completion photos.
8. **Customers.** Open the Customers tab, search, and open a customer to see their jobs.
9. **Team.** Invite a new worker from Team. The email appears at http://localhost:54324 and the link opens "Pick a password".
10. **Access.** As Dean, check that job 1 isn't visible. Typing its link directly shows nothing either, because the database refuses it.

## 5. Automated tests

```bash
npm run typecheck
npm test
npm run db:test       # or scripts/db-harness/run.sh . where Docker isn't available
```

The AG database tests are in `supabase/tests/core_job_records.test.sql`, `extra_work.test.sql`, `core_job_files.test.sql`, `core_customers.test.sql` and `core_team.test.sql`.

## 6. Setting up the real business (trial)

Do this on the hosted project only, with approval. Never run the seed scripts there.

1. Platform admin (web `/admin`): add the business "AG Property Maintenance".
2. Switch on Job records and Extra work, upload the logo and set the colours (both must pass the contrast check).
3. Invite Arnis as Owner. He then invites his team from Team on his phone.
4. Builds: see `docs/deployment/mobile-store-deployment.md`.

## 7. Open questions

These are with Arnis:
- Should updates wait and send themselves when there's no signal? Today only photos do that.
- What are the real staff names and roles?
- What should a manager be allowed to do?
- What is the name of his invoicing software?
- What should the final price be after the trial?
