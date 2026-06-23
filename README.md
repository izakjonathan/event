# EventOS v46 — Comparison Layout Fix

This build keeps the v45 iOS home screen icon fix and tightens the Event Comparison mobile layout.

## Fixes

- Fixed Event Comparison metric cards clipping large DKK values on narrow iPhone screens.
- Added compact stat variants for dense comparison layouts.
- Changed selected event comparison metrics from three cramped columns to a safer two-column layout.
- Applied compact stats to Best / worst, selected comparison, financial event metrics, and breakdown cards.
- Kept rounded corners, no-animation baseline, current typography controls, PWA/icon setup, and speed optimizations intact.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- All routes build as static pages.

## Deploy

Upload the ZIP contents to GitHub/Vercel as the project root. Do not include `.next`, `node_modules`, `package-lock.json`, or `tsconfig.tsbuildinfo`.
