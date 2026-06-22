# Event Operations System

Mobile-first Next.js + Tailwind event operations workspace.

## Deploy on Vercel

Import this folder/repository into Vercel.

Recommended Vercel settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`
- Node.js: 22.x or newer

This package also includes `vercel.json`, which sets the install and build commands explicitly.

## Environment variables

Add these in Vercel if you want Supabase persistence:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app has local fallback behaviour if Supabase is not configured.

## Supabase

Run `SUPABASE_SCHEMA.sql` in your Supabase SQL editor.

It creates:

- `event_plans`
- `artist_submissions`
- `project_management_projects`
- `project_management_tasks`
- storage bucket `artist-images`
- prototype anonymous access policies

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
```

Build has been tested successfully.
