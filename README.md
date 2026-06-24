# EventOS v51 — Full Resolution Background Images

This build fixes the UI Studio background image quality issue.

## Changes

- Removed the background image downscaling/compression step.
- UI Studio now keeps uploaded background images at their original resolution.
- Supabase uploads now use the original image file instead of a compressed JPEG copy.
- Local fallback applies the original image data URL.
- Local storage writes now fail safely if a very large local-only background image exceeds browser storage.
- Updated UI Studio background status messages to make full-resolution handling clear.

## Notes

For persistent full-resolution images across devices, use Supabase storage. Very large local-only images may apply for the current session but not persist if browser localStorage quota is exceeded.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.


## v52 fixed background image viewport
- Background images now render on a dedicated fixed viewport layer instead of on the scrolling document.
- `cover` and `contain` now calculate against the visible screen, not the full page height.
- The image stays fixed when scrolling.
- UI Studio labels were updated to make the fixed-screen behavior clear.
