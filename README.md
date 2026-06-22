# EventOS v24 — Metric typography and planner metrics

Mobile-first EventOS build with updated metric cards and Event Planner overview metrics.

## Changes in v24

- Added more metrics to the Event Planner top section:
  - Profit
  - Revenue
  - Costs
  - Margin
  - Tickets
  - Break-even
  - Bar profit
  - Staff cost
- Updated all shared metric cards through the `Stat` component:
  - larger metric number typography
  - heavier number weight
  - `DKK` displayed as a light-weight unit
  - `%` displayed as a light-weight unit
- Changed money formatting from `kr.` to `DKK` globally.
- Removed tap/press feedback from cards.
- Kept button and dock feedback intact for navigation clarity.
- Production build tested successfully.

## Deploy

Use Vercel with the included settings:

- Install command: `npm install --no-audit --no-fund --progress=false`
- Build command: `npm run build`
- Node: `20.x`
- npm: `10.x`

Optional environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
