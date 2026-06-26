# EventOS v64 — Staff / Volunteers module

Built from v63.

## Added

- New `Staff / Volunteers` module on Main.
- New `/staff` internal staff management route.
- New `/volunteer-signup` public volunteer form route.
- Public volunteer form has no dock/navigation and asks volunteers for:
  - name
  - phone
  - email
- Staff records can be manually added or submitted through the public link.
- Staff can be assigned to multiple events and multiple projects, or no assignments.
- Staff records include:
  - name
  - phone
  - email
  - position
  - description
  - availability
  - status
  - linked events
  - linked projects
  - internal notes
- Staff data saves locally and through Supabase when configured.
- Supabase schema now includes `staff_members` table and prototype policies.

## Kept

- Public artist form has no dock.
- Existing Artist Management multi-event linking.
- Existing Project Management, Event Planner, UI Studio background image, dock and iPhone icon fixes.

## Verify

- `npm run typecheck` passes.
- `npm run build` passes.
