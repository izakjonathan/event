# EventOS v48 — final CSS/layout pass

Final bug-only CSS/layout audit from v47.

## Changes
- Removed unused `.eos-stat-micro` CSS rules.
- Re-checked global CSS against the app/component code.
- Kept the consolidated typography/color token system unchanged.
- Kept rounded corners, no-animation baseline, iOS icon setup, and Event Comparison module intact.
- No feature changes.

## Validation
- `npm run typecheck`
- `npm run build`

## Deployment
Upload the full ZIP contents to the repository root and deploy on Vercel.


## v49 UI Studio dock/layout polish

- Reduced floating dock height slightly to cover less content on iPhone.
- Increased page bottom padding so final controls can scroll fully above the dock.
- Added scroll padding to help focused fields avoid the floating dock.
- Loosened only title/heading line-height enough to avoid clipped descenders while keeping tight typography.
- Kept colors, typography controls, rounded corners, no-animation baseline, icon setup and comparison module intact.
