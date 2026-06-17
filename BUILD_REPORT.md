# Event Planner Calculator v26

Built from latest working v25.

Changes:
- Fixed Add new event so it always creates a truly blank event.
- Removed the forced “Event X” name from new blank events.
- Added a separate trulyBlankEvent() factory that does not use template/default/demo data.
- New events now have:
  - empty name
  - empty date/end date
  - empty start/end time
  - empty location
  - empty terms
  - no tickets
  - no income rows
  - no expense rows
  - no bar values
  - no staff rows
  - no scenarios
  - disabled/empty terms plan
  - no files
- Existing saved events are not deleted or modified.
- Templates can still create prefilled structures only when selected as templates.
- Existing Supabase/database compatibility unchanged.
