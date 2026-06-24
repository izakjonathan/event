# EventOS v54 — background bottom safe-area fix

This build fixes the fixed background image layer so uploaded backgrounds extend beyond both the top and bottom iPhone safe areas / browser chrome overlay.

## Changes

- Keeps the background image fixed behind the app.
- Extends the fixed background layer above the iPhone rounded/top safe area.
- Extends the fixed background layer below the visible viewport so the image continues behind the bottom Safari/PWA area.
- Removes the old fixed height behavior that could stop the image too early at the bottom.
- Keeps cover/contain/original background modes.
- Keeps the dock as a full solid UI Studio controlled color.
- Keeps all previous v53 functionality.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
