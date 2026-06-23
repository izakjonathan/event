# EventOS

Mobile-first Next.js + Tailwind event operations workspace.

## v39
- Fixed the Dashboard logo weight split: `Event` is now light via `eos-logo-event`, while `OS` is bold via `eos-logo-os`.
- Renamed Event Planner section `Linked artists / lineup` to `Artists`.
- Build verified with `npm run typecheck` and `npm run build`.

## Main routes
- `/` — Dashboard
- `/event-planner` — Event planner
- `/artists` — Artist management
- `/artist-booking` — Public artist submission form
- `/calendar` — Calendar view
- `/ui-studio` — UI Studio
- `/project-management` — Project board
- `/bar-planner` — Bar planner
- `/suppliers` — Supplier list

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
