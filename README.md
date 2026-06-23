# EventOS

Mobile-first Next.js + Tailwind event operations workspace.

## Current baseline

v36 focuses on faster dock/module navigation while keeping the no-animation and rounded-corner baseline.

Changes in this build:
- removed unnecessary `force-dynamic` from all route pages
- added explicit dock route prefetching after load
- kept direct, no-animation module switching
- kept the cleaned global typography system from v35
- kept rounded corners intact

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

## v38
- Main dashboard typography fix: Modules label now shares the same caption class as Workspace.
- EventOS wordmark now keeps Event at the current display weight and makes OS bold.
- Dashboard stat label changed from Open tasks to Tasks.
- Added Supplier List module at `/suppliers`.
- Suppliers include name, contact person, phone, mail, webpage, type, label and note.
- Saved suppliers display as collapsible cards.
- Added Supabase `suppliers` table and prototype policies to `SUPABASE_SCHEMA.sql`.
- Typecheck and production build confirmed.
