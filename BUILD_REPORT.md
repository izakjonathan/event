# Event Operations System v36

Built from confirmed working v35.

Changes:
- Added new Calendar / Schedule module at `/calendar`.
- Added Calendar / Schedule card to the dashboard.
- Calendar loads all Event Planner events from Supabase.
- Events are sorted by event date.
- Shows connected artists under each event.
- Shows artist start and end times.
- Shows artist fee.
- Shows event status, event time and location.
- Added missing-info warnings:
  - no date
  - no location
  - no artist
  - no artist start time
  - no artist end time
  - no artist fee
- Added quick links:
  - Dashboard
  - Planner
  - Artists
  - Copy artist form link
- Removed Venue calendar from future modules because Calendar / Schedule is now live.
- Existing Event Planner, Artist Management and Artist Booking remain intact.
