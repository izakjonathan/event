# Event Planner Calculator

A mobile-first Next.js + Tailwind + Supabase event planning calculator, styled after the uploaded Rummy 500 build.

## Features

- Create and switch between multiple event plans.
- Event details: name, date, time, location, terms and notes.
- Ticket tiers with editable ticket price, tickets sold and capacity.
- Live totals for ticket revenue, total income, expenses, profit, margin, fill rate, profit per guest and break-even guests.
- Income and expense rows with name, amount, quantity and notes.
- Row modes:
  - Fixed: amount × quantity.
  - Per ticket holder: amount × tickets sold × quantity. Use this for “all ticket holders spend 200 DKK in the bar”.
  - % of ticket revenue: percentage × ticket revenue × quantity.
- Saves locally by default.
- Supabase-ready cloud saving when env variables are added.

## Local development

```bash
npm install
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Run `SUPABASE_SCHEMA.sql` in the Supabase SQL editor.
3. Add these env vars locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app works without Supabase, but saves only in the current browser.

## Vercel

- Framework preset: Next.js
- Build command: `npm run vercel-build`
- Install command: `npm install`
- Node: 20.x, already set in `package.json`
