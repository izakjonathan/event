# EventOS v66 — reusable event templates

This build adds saved event templates to Event Planner.

## Changes

- Added a reusable **Template builder** inside Event Planner.
- Templates let you choose exactly what information should be reused:
  - event name/date/time/location/status/terms/notes
  - tickets
  - income and expenses
  - staff costs
  - bar calculation
  - scenarios
  - venue terms
  - artists
- You can save the current draft as a template.
- You can update an existing template from the current draft.
- You can apply a template to the current event draft.
- You can load a template as a new unsaved event draft, fill in the missing details, then save it as a new event.
- Added local persistence for event templates.
- Added optional Supabase `event_templates` table and policies.
- Kept v65 Event Planner CSV import, desktop layout, insights, v64 staff/volunteers, v63 public artist form, v61 project tasks, and previous dock/background/icon fixes.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- All routes build as static pages.

## v67 Template builder collapse update
- Event Planner Template builder is now a collapsible section.
- Template builder is collapsed by default on fresh page load/open.
- Template save/load/update behavior is unchanged.
