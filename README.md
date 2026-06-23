# EventOS

Mobile-first Next.js + Tailwind event operations workspace.

## v37 Typography controls in UI Studio

This build adds global typography controls to UI Studio and saves those values inside presets.

Typography controls now include:
- font stack for display text
- font stack for UI/body text
- size
- weight
- letter spacing
- caps on/off

Presets now include both color tokens and typography tokens, so loading a preset restores the complete visual system.

## Main routes

- `/` — Dashboard
- `/event-planner` — Event planner
- `/artists` — Artist management
- `/artist-booking` — Public artist submission form
- `/calendar` — Calendar view
- `/ui-studio` — UI Studio
- `/project-management` — Project board
- `/bar-planner` — Bar planner

## Deploy on Vercel

1. Upload/extract this ZIP into a GitHub repo so `package.json` is at the repo root.
2. Import the repo in Vercel.
3. Vercel will use:
   - Install Command: `npm install --no-audit --no-fund --progress=false`
   - Build Command: `npm run build`
   - Node: `20.x`
4. Add environment variables if using Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run `SUPABASE_SCHEMA.sql` in the Supabase SQL editor.

The app has a local fallback mode if Supabase is not configured.

## Local setup

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run build
```
