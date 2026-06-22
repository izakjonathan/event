# Event Operations System

Mobile-first event operations workspace for event planning, artist booking/management, calendar readiness, bar planning and project tasks.

## Deploy on Vercel

1. Upload the extracted project files to GitHub. Do not upload the ZIP itself.
2. Import the GitHub repo in Vercel.
3. Keep the included `vercel.json` settings.
4. Add environment variables if you want Supabase persistence:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

## Local development

```bash
npm install --no-package-lock
npm run dev
```

## Production build

```bash
npm run build
```

The Vercel build uses `next build --turbopack` and avoids committing a lockfile so Vercel installs from the public npm registry instead of an environment-specific lockfile.

## Supabase

Run `SUPABASE_SCHEMA.sql` in your Supabase SQL editor. The app works locally without Supabase and falls back to browser storage.
