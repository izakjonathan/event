# EventOS v26 — Supabase UI Studio presets + dock cleanup

## What changed

- UI Studio custom presets now save to Supabase in `ui_studio_presets` and load by `owner_key`, so saved presets can be reused from other devices using the same workspace key.
- UI Studio keeps a local fallback only when Supabase is not configured or unavailable.
- Removed UI Studio from the Main page modules and removed the Main page UI Studio callout card. UI Studio is now only accessible from the floating dock.
- Touched up the dock icons with cleaner inline SVG icons for Main, Planner, Artists, Calendar and Studio.
- Kept the existing fast dock fade navigation.
- Production build confirmed with `npm run build`.

## Supabase update required

Run the updated `SUPABASE_SCHEMA.sql` in Supabase SQL editor. It adds:

- `public.ui_studio_presets`
- owner/date index
- prototype anonymous RLS policies matching the rest of this prototype app

If the table has not been created yet, UI Studio will show a Supabase preset error and fall back to local presets on the current device.

## Deploy

Upload/commit this ZIP as the full project root. The ZIP excludes `node_modules`, `.next`, and `package-lock.json`.
