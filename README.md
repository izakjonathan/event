# EventOS v53 — fixed viewport background + solid dock color

This build fixes the iPhone background-image and dock-color issues from v52.

## Changes

- Background image layer now extends upward into the iPhone safe-area/top rounded/notch area.
- PWA status bar style changed to `black-translucent` so the app background can show behind the top iPhone area.
- Background image remains a fixed viewport layer and does not scroll with page content.
- `Cover fixed screen`, `Contain fixed screen`, and `Original size, fixed` continue to fit the visible screen instead of the full page height.
- Added a separate global `dock` color token.
- UI Studio now has a **Dock color** control.
- The floating dock always uses the solid `dock` color and is no longer affected by transparent content/card fill settings.
- Existing transparent background/surface/content layer toggles remain unchanged.
- Full-resolution background image uploads remain unchanged.
- iPhone homescreen icon setup remains unchanged.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- All app routes build as static pages.
