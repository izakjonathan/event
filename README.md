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
