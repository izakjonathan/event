# EventOS v40 — UI Studio typography reaction fix

This build fixes why typography changes in UI Studio did not appear to affect the full site clearly.

## What was wrong

1. The dashboard logo used separate CSS variables for `Event` and `OS` weights, but those variables were not part of the saved theme object or UI Studio controls.
2. Display size used a `clamp(...)` rule with a hard minimum, so lowering display size in UI Studio could appear to do nothing.
3. Font stack changes could look unchanged on devices that did not have the selected fonts installed locally.

## Fixes

- Added `type-logo-event-weight` and `type-logo-os-weight` to the global theme object.
- Added UI Studio controls for Event logo weight and OS logo weight.
- Logo weights now save and restore in presets, including Supabase presets.
- Display size now uses the actual UI Studio value directly.
- Added Google font import for Inter and Space Grotesk so font stack changes are visible after deploy.
- Typecheck and production build both pass.

## Verification

```bash
npm run typecheck
npm run build
```
