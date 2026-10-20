# Prompt: app design board

Paste everything in the box into a new chat to start the design board. It describes the app as built on 2026-10-20. Update the screen list when new screens land.

```
Create a design board (a visual design, not code) for a field-service job-management app. Lay out every screen below as a frame, grouped by who uses it and on which device. Add a small component sheet and the main flows as arrows between frames. Use invented sample data only: no real company or person names.

## The product
- One app, configured per client business. Today's first client is a small flooring business in Ireland: the owner takes enquiries, does viewings (measuring rooms), quotes, books jobs into the diary and pays a few fitters. Today he uses a wall planner and texts fitters each evening. His top priority is a clear schedule and less admin.
- Built in React Native (Expo), so design with simple, buildable pieces: cards, buttons, chips, text fields, lists, a modal photo viewer. No complex custom charts or gestures.
- Each business has its own logo, a main colour and an accent colour, plus its own job titles (e.g. "Fitter", "Operative"). Design with a placeholder brand and show one alternative brand on two key screens to prove the theming works. Both brand colours must carry white text at a contrast of at least 4.5:1. Everything else is neutral: text #1F2328, muted #59636E, borders #D1D9E0, cards #FFFFFF, background #F6F8FA, danger #CF222E, success #1A7F37, warning #9A6700.
- Writing style: plain English, no jargon, short labels. Irish context: euro, dates like "Mon 2 Nov", 24-hour times like 08:30.
- Field use: big touch targets (at least 44 pt), readable in sunlight, usable with one hand on a phone. The owner's screens should also work on a tablet held in landscape at a customer's house.
- Hard rule: field staff (fitters) never see prices anywhere.

## People and devices
1. Owner / manager: tablet and phone. Runs everything.
2. Fitter / worker: phone. Sees only the jobs they're booked on.
3. Platform admin (the software team, not the client): desktop web browser, sets up client businesses.

## Screens to design

### Sign in (all)
- Login (email, password, business branding if known).
- Set password (from an invite email link).
- "Your account isn't set up yet" message with Sign out.

### Home (all)
- Business logo, business name, the person's job title; then one tile per feature they can use (title + one-line description); Settings; Sign out. Show the owner's version and the fitter's version.

### Enquiries (owner)
- Enquiries list grouped by stage, with counts: New (arrange a viewing) · Viewing booked · Measured (ready to quote) · Work booked · Not going ahead. Each row shows the customer, what they want, phone, address, how they got in touch and when, plus the viewing and work dates if set. Filter: Open / All. "New enquiry" button.
- New enquiry: (1) Customer: search by name, phone or email with results, or "New customer" (name, phone, email, address, notes). (2) What they want, site address ("blank = customer's address"), how they got in touch as chips (Phone call, Email, Website, Walk-in, Referral, Social media, Other), details. (3) Viewing date and time (optional). Problems listed in plain English above the Save button.
- Enquiry detail: summary with stage and source; customer card with Call, Email and Edit; viewing time with "Start the viewing" or "Open viewing (3 rooms)"; Next: "Book the work", "Not going ahead" (with optional reason) or "Reopen".

### Viewings (owner, tablet-first)
- Viewings list: jobs with "No viewing yet" or "Viewing Mon 2 Nov · 3 rooms"; quick "New job" box.
- Viewing screen: viewing date/time, hours the job will take, notes; Rooms card with total m² and each room (name · area, then length × width · floor type · notes); tap a room to edit it inline (room name, length and width in metres OR area for odd shapes, live "Area: 14.7 m²", floor type chips Laminate / Engineered wood / Solid wood / Vinyl / LVT / Carpet / Tiles plus "other", notes, Save / Cancel / Remove); "Add room"; Viewing photos grid with "Take photo" and "Choose photos", photos still uploading shown faded with "2 photos waiting to upload (no signal? it will keep trying)" and "Try again now".

### Schedule (owner)
- Week view: "‹ Previous | Week of Mon 2 Nov | Next ›", person filter chips (Everyone + each fitter), one card per day (Today marked) listing bookings as "08:30–16:30 Oak floor, kitchen" with people and address; "Add" on each day. Show a busy week with 3–4 jobs a day across 3 fitters.
- Booking form: job (chips of recent jobs or "add a new job"), day, start, finish, who's going (chips), notes for the job sheet; a red clash warning ("Clash: Seán already booked 09:00–13:00."); Save disabled until it's fixed; "Cancel this booking" when editing.

### Fitter (phone)
- My jobs: the next two weeks, grouped by day, each job with times, what it is and the address.
- Job sheet: job title, day and times, who else is going; Where (address + "Open in maps"); Customer (name + "Call 087 …"); Notes; Rooms (total m², each room with area, size and floor type, hours needed); Photos grid (tap to view full screen). No prices anywhere.

### Timesheets (feature for construction-type clients; all roles)
- My hours: the week, total hours, each day's entries, Clock in / Clock out panel, "Send in my week".
- Day: entries for one day with Add.
- Entry form: start/finish or duration, break, job, work category.
- Sign-offs (manager): weeks waiting, then a week review with Approve / Send back with reason.
- Hours & export (manager): period picker (This week, Last week, Last 4 weeks, This month, Last month, Custom), totals by person / job / week, Export CSV / PDF, earlier exports.

### Settings (owner)
- Settings generated per feature: cards with choice chips, number fields and on/off switches; read-only note for non-owners.

### Platform admin (desktop web, max ~960 px content)
- Businesses list: each with people count, owners, time zone, modules on; red "No owner yet" warning; "Add a business" form.
- Business detail with tabs as chips: Details (name, time zone, ID) · Branding (logo upload, main and accent colour fields showing their contrast ratio, live preview of a button and chips in those colours, name on documents, contrast warnings) · Job titles (one field per role, blank = standard title) · Modules (on/off switch per module, then that module's settings) · People (list with role, email, "Invited 19 Oct, not signed in yet" / "Last signed in…", Change role, Deactivate; Invite someone form) · History (who changed what, when).

### Coming next (design ahead, owner only)
- Quote builder: line items from the measured rooms (room, floor type, m², price per m², extras such as underlay, door bars, removal, labour), subtotal, VAT, total; preview of a branded A4 quote PDF; Share (WhatsApp / email). Mark clearly as owner-only.

## States to show
- Empty (first use), loading, an error message in plain English, a saving button, and offline photo uploads waiting.
- Phone (≈390 × 844), tablet landscape (≈1180 × 820) for the owner's Enquiries, Viewing and Schedule, and desktop for the admin.

## What I want back
1. The board: frames grouped as Sign in · Owner (tablet) · Owner (phone) · Fitter (phone) · Admin (web) · Coming next.
2. A component sheet: Button (main, secondary, danger, busy, disabled), Chip (selected, not selected, disabled), Text field (with hint and error), Card, list row, photo tile (uploaded / waiting), stage badge, clash warning, empty state.
3. Flow arrows for: enquiry → viewing → book the work → fitter's job sheet; and admin invite → set password → home.
4. A short list of design decisions and open questions (for example, should viewings appear on the schedule?).
```
