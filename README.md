# Event Planner Calculator v2

Next.js + Tailwind + Supabase event planning tool for forecasting event revenue, expenses, ticket sales, bar spend, staff cost and profit splits.

## What is new in v2

- Shared workspace links: open the same `?workspace=...` link on different devices to access/edit the same event data.
- Event templates: blank, concert, quiz night, private party, DJ night, football screening and corporate event.
- Scenario mode: low / expected / best-case planning with editable tickets, ticket price, bar spend and expenses.
- Dedicated staff cost calculator.
- Dedicated bar revenue calculator.
- Break-even helper.
- Venue terms / profit split calculator.
- Event statuses: idea, quoted, confirmed, cancelled, completed.
- Collapsible mobile-first sections.
- Copy text summary and CSV export.

## Local setup

```bash
npm install
npm run dev
```

## Vercel environment variables

Add these to Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Then redeploy.

## Supabase setup

Run `SUPABASE_SCHEMA.sql` in Supabase SQL Editor.

The v1 database table still works for v2. No new columns are required because the app stores the event plan in the `payload` JSON field.

## Sharing between devices

Use the Workspace button in the app, then copy the workspace link. Any device opening that same link will use the same Supabase `owner_key` and edit the same event list.

Example:

```txt
https://your-vercel-site.vercel.app?workspace=temple-events
```

## Important security note

This is a simple shared-link setup. Anyone with the workspace link can edit that workspace. Add Supabase Auth later if you need private users, logins or permissions.


## v27 System routes

- `/` — Event system dashboard
- `/event-planner` — Existing Event Planner Calculator module
- `/artist-booking` — Placeholder for future public artist booking form
- `/artists` — Placeholder for future internal artist submissions admin page


## v28 Artist Booking setup

Run the SQL in `SUPABASE_SCHEMA.sql` to add the `artist_submissions` table.

Routes:
- `/artist-booking` — public artist submission form
- `/artists` — internal artist submissions admin/review page

The app uses the existing Vercel env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`


## v29 Artist images + event lineup

Run the updated `SUPABASE_SCHEMA.sql` in Supabase.

New:
- `/artist-booking` supports real image file upload to Supabase Storage bucket `artist-images`.
- `/artists` lets you add an artist submission to an existing event.
- `/event-planner` now includes an Artists / Lineup section.
- Connected artist fees count as event expenses.


## v30 Booking workflow polish

New admin workflow:
- Edit artist submissions on `/artists`
- Archive/reject artists without deleting their records
- See booked/linked artists overview
- Filter linked and unlinked artists
- See which event an artist is connected to
- Duplicate artist-to-event links are blocked before saving


## v31 Public artist form polish

- `/artist-booking` is now a standalone public form with no dashboard link.
- `/artists` has a “Copy artist form link” button for sharing the public form with artists.
