# EventOS v50 — UI Studio background image controls

This build adds background image support to UI Studio while keeping the v49 layout/icon baseline.

## Added
- UI Studio background image upload.
- Use background image on/off toggle.
- Background image fit mode: cover, contain, original size.
- Layer fill toggles for background, surface, and content/card fills.
- One-tap transparent layer mode and fill restore.
- Background image settings are saved in the active theme.
- Background image settings are included in saved presets.
- Supabase storage support for cross-device background images via `ui-background-images` bucket.
- Local fallback stores a compressed data URL on the current device when Supabase is not configured.

## Kept
- Rounded corners.
- No-animation baseline.
- UI Studio typography and color controls.
- iOS home screen icon setup.
- Static route build optimization.

## Verification
- `npm run typecheck` passes.
- `npm run build` passes.
- ZIP excludes `.next`, `node_modules`, `package-lock.json`, and `tsconfig.tsbuildinfo`.
