# Event Operations System

A mobile-first Next.js + Tailwind operations workspace for event planning, artist booking, event review, bar planning and project/task management.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase persistence with local fallback
- Mobile-first iPhone/Safari layout

## Routes

- `/` Dashboard / landing page
- `/event-planner` Event Planner
- `/artist-booking` Public Artist Booking form
- `/artists` Artist Management
- `/calendar` Calendar / Schedule review
- `/bar-planner` Bar Planner
- `/project-management` Project Management

## Setup

```bash
npm install
npm run build
npm run dev
```

The app is compatible with Node 24. It also builds on newer Node 22+ environments used by many preview systems.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `SUPABASE_SCHEMA.sql`.
4. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server.

If Supabase is not configured or a request fails, the app continues in local fallback mode using `localStorage` and shows a warning.

## Persistence model

Events are saved in `event_plans`. The main event object is stored as JSON in `payload`, with `owner_key` used as the shared workspace key. Bar Planner saves data into `payload.barPlanner`. Artist Management links artists into `payload.artists`. Project Management uses separate project/task tables and links to events through `linked_event_id`.

## Production notes

The included Supabase policies are intentionally open for a shared-link prototype. Replace them with authenticated, workspace-scoped policies before using with private or commercial data.


## Vercel deployment note

This project includes both `build` and `vercel-build` scripts. If Vercel is configured to run `npm run vercel-build`, it will execute `next build`. You can also set the Vercel Build Command to `npm run build`.
