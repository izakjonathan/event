# Event Operations System

Mobile-first Next.js + Tailwind event operations workspace.

## Version
v4 header removed + iOS floating dock layout.

## Run locally

```bash
npm install
npm run build
npm run dev
```

## Vercel

Use Node 24.x.

Build command:

```bash
npm run build
```

The package also includes:

```bash
npm run vercel-build
```

## Supabase environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run `SUPABASE_SCHEMA.sql` in Supabase SQL Editor before using shared persistence.
