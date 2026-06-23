# EventOS v35

Build-fix release based on the v34 typography cleanup.

## Fix

- Fixed the Vercel TypeScript build error in `components/ui/AppShell.tsx` by restoring the missing `useState` import used by the `Section` accordion state.
- Kept the typography cleanup baseline from v34.
- Kept rounded corners and no-animation baseline intact.

## Verification

Both commands pass:

```bash
npm run typecheck
npm run build
```

## Deploy

1. Upload/extract this ZIP into a GitHub repo so `package.json` is at the repo root.
2. Import the repo in Vercel.
3. Vercel will use:
   - Install Command: `npm install --no-audit --no-fund --progress=false`
   - Build Command: `npm run build`
   - Node: `20.x`
4. Add environment variables if using Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run `SUPABASE_SCHEMA.sql` in the Supabase SQL editor if needed.
