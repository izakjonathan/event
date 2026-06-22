# EventOS

Mobile-first Next.js + Tailwind event operations workspace.

## UI Studio

Open `/ui-studio` or tap **Studio** in the bottom dock. It is also shown as the first module on the Dashboard.

## Deploy on Vercel

1. Upload/extract this ZIP into a GitHub repo so `package.json` is at the repo root.
2. Import the repo in Vercel.
3. Vercel will use:
   - Install Command: `npm install --no-audit --no-fund --progress=false`
   - Build Command: `npm run build`
   - Node: `20.x`
4. Add environment variables if using Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run `SUPABASE_SCHEMA.sql` in Supabase SQL editor.

The app has a local fallback mode if Supabase is not configured.

## Local setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```


## v21
- Removed the active dock pseudo-element dot so active navigation is shown only through the pill/icon state.
- Production build confirmed.


## v25 Metric spacing and UI Studio presets
- Added visible spacing between metric numbers and `DKK` / `%` units.
- Added custom UI Studio presets saved to localStorage under `eos-ui-custom-presets`.
- UI Studio can save the current theme as a reusable named preset and delete saved custom presets.
- Built-in presets remain available.
- Production build verified with `npm run build`.
