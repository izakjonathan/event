# EventOS v68 — Template builder defaults

Template builder update for Event Planner.

## Changes

- Template builder remains collapsible and collapsed by default.
- Template field checkboxes are now inside a separate collapsible sub-card.
- The field checkbox sub-card is collapsed by default.
- All template fields are checked by default.
- Saving an event as a template now includes all Event Planner information unless specific fields are unticked.
- Loading/updating templates keeps the existing reusable-template workflow.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
