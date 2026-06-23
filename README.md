# EventOS

Mobile-first Next.js + Tailwind event operations workspace.

## v33
- Reverted the app back to the original EventOS typography direction.
- Kept rounded corners and the no-animation baseline.
- Added varied weights with tight line-height: body, labels, buttons, headings, display and metrics now have distinct weights.
- Removed the brutalist single-weight font overrides.
- Production build and typecheck confirmed.

## Current baseline

This cleanup build focuses on making the codebase easier to maintain and easier to do a dedicated typography pass on next.

Included in this cleanup run:
- cleaned and reformatted shared utilities and smaller feature modules
- cleaned route entry files
- added a `.gitignore` for deployment-friendly repos
- changed `lint` to TypeScript checking and added `typecheck`
- cleaned shared UI shell / CSS structure to make typography edits more centralized
- updated `SUPABASE_SCHEMA.sql` so storage policies use valid Supabase/Postgres syntax
- ready to continue from this version for the next typography run

## Main routes

- `/` — Dashboard
- `/event-planner` — Event planner
- `/artists` — Artist management
- `/artist-booking` — Public artist submission form
- `/calendar` — Calendar view
- `/ui-studio` — UI Studio
- `/project-management` — Project board
- `/bar-planner` — Bar planner

## UI Studio

UI Studio is available from the dock and through `/ui-studio`.
Saved presets are intended to sync through Supabase using the `ui_studio_presets` table.

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

## v34 typography cleanup
- Centralized typography into one small control block at the top of `app/globals.css`.
- Removed unused typography aliases and Tailwind typography override rules.
- Replaced scattered font/size utility usage with semantic classes: `eos-display`, `eos-heading`, `eos-title`, `eos-body`, `eos-caption`, `eos-button`, `eos-stat-value`, `eos-nav-label`.
- Kept rounded corners and the no-animation baseline intact.
- TypeScript and production build verified.
