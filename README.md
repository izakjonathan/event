# EventOS v22 — cleanup and reliability fix

This build cleans up the v21 codebase and fixes the review issues found after the animation pass.

## What changed

- Removed the Dashboard Supabase alert/pill output so sync messages do not reappear in the Main hero.
- Added a shared `lib/theme.ts` file so UI Studio and AppShell use the same theme defaults, validation and application logic.
- UI Studio now normalizes saved theme values before applying them, preventing broken localStorage values from becoming invalid CSS variables.
- Replaced old hardcoded Tailwind color utility usage in components with EventOS token classes.
- Simplified `globals.css` and removed the old compatibility override block for legacy Tailwind colors.
- Kept only reliable animation behavior: dock active animation, press feedback and controlled accordion open/close.
- Removed weak route/card stagger animations that were not reliably visible on iOS/Safari.
- Replaced native `prompt`, `confirm` and `alert` usage in app modules.
- Reduced localStorage risk by stripping large base64 file data from persisted event payloads; file metadata remains, but large files should use Supabase Storage for long-term storage.
- Kept the Vercel-friendly setup: Next.js app router, no lockfile requirement, and `npm install` as the Vercel install command.

## Build check

`npm run build` passes.

## Deploy

Upload the ZIP contents to GitHub/Working Copy with `package.json` at the repository root, then deploy through Vercel.
