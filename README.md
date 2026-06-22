# Event Operations System

Mobile-first Next.js + Tailwind event operations workspace.

## v13 changes

- Improved UI Studio day/night mode contrast.
- Day mode now uses light backgrounds with black text and stronger dark borders.
- Night mode keeps dark backgrounds with light text and light borders.
- Text color is part of UI Studio and is applied across headings, body text, fields and dock labels.
- Studio badges and status pills are more readable in day mode.
- Floating dock is slightly smaller and page bottom spacing is larger so content is not hidden behind the dock/Safari bar.

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
