# EventOS v42 — Final hardening, cleanup and speed pass

This build is based on v41 and applies the final release-hardening pass requested before calling the app complete.

## What changed

- Removed unused `AppShell` header props/actions after the header had already been removed.
- Removed unused status/alert state from the global event store so optional Supabase sync no longer causes global UI re-renders.
- Stabilized store action functions with `useCallback` to reduce unnecessary context churn.
- Deferred the initial Supabase refresh with idle scheduling so first paint and dock navigation are less likely to be blocked after load.
- Deferred UI Studio theme/preset `localStorage` writes so typography/color slider edits do not block interaction as much.
- Added idle dock route prefetching after first paint.
- Added lightweight lazy/async image decoding on artist preview images.
- Revoked generated CSV object URLs after export.
- Kept the no-animation baseline intact.
- Kept rounded corners intact.
- Kept the v41 consolidated global CSS/token system intact.
- Re-audited CSS class usage: no unused CSS classes were found.
- Verified all routes are still static in the production build.

## Validation

- `npm run typecheck` passes.
- `npm run build` passes.
- Build output shows all app routes prerendered as static pages.

## Deploy

Upload this folder to GitHub/Vercel as the project root. The ZIP excludes generated build/dependency folders.
