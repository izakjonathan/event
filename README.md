# Event Operations System

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
