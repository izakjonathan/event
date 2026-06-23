# EventOS v43 — Event comparison module

Final hardening baseline with a new Event Comparison module.

## Added

- New `/event-comparison` route.
- New dock item: Compare.
- New Main page module: Event Comparison.
- Event Planner now has an `Event metrics / review` section with structured comparison fields:
  - event type
  - label
  - expected guests
  - actual guests
  - planned staff
  - actual staff
  - total staff hours
  - supplier cost
  - equipment cost
  - other cost
  - ticket revenue
  - bar revenue
  - other revenue
  - review notes
- Compare module shows all created events as collapsible cards.
- Added filters for date range, venue, type, status and completed-only.
- Added sorting by date, profit, revenue, cost, margin, revenue per guest and cost per guest.
- Added best/worst metric cards.
- Added selected comparison for up to four events.
- Added CSV export for comparison data.

## Data behavior

- New review metrics are stored inside each event payload.
- Supabase does not need a table change because event payloads are saved as JSON.
- Existing events hydrate with blank review metrics automatically.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- All routes build as static pages.

## Notes

- Rounded corners are intact.
- No-animation baseline is intact.
- Consolidated typography/theme controls are intact.
