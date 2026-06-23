# EventOS v41 — final cleanup and speed pass

This build is based on v40 and focuses on final consolidation, faster first-load behavior, and a smaller global style system.

## Main cleanup

- Rebuilt `app/globals.css` around one small global token system.
- Removed unused typography line-height variables from UI Studio/theme presets.
- Removed the unused shadow color token and card/dock shadow dependency.
- Removed unused CSS classes and duplicate global typography rules.
- Kept rounded UI shape language intact.
- Kept the no-animation baseline intact.
- Kept supplier list, artist fixes, typography presets and UI Studio preset saving.

## Typography system

Typography is now controlled by a smaller set of global CSS variables:

- display font and UI font
- size, weight, letter spacing and caps for display, heading, title, body, caption, button and metric text
- separate logo weights for `Event` and `OS`

Line-height is fixed in CSS so the app stays consistently tight without needing extra controls.

## Speed optimizations

- All routes build as static pages.
- Font loading moved from CSS `@import` to layout `<link>` tags with preconnect.
- Dock route prefetching is kept.
- Local storage is no longer parsed on every store render.
- Local storage writes are deferred with idle/timeout scheduling.
- Initial Supabase refresh is deferred until after first paint.
- Removed unused/deduplicated CSS so less style work is needed.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- Static routes generated: `/`, `/artist-booking`, `/artists`, `/bar-planner`, `/calendar`, `/event-planner`, `/project-management`, `/suppliers`, `/ui-studio`.

## Deploy

Use Node 20.x and npm 10.x. The ZIP excludes `.next`, `node_modules`, `package-lock.json` and `tsconfig.tsbuildinfo`.
