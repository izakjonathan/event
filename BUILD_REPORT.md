# Event Planner Calculator v8

Built from latest working v7.

Changes:
- Fixed UI Studio type scale so typography actually changes.
- Replaced type scale slider with + / − buttons.
- Tightened top pill typography so Unbounded does not overscale the top buttons.
- Removed Event details card from Settings.
- Removed Add new event from Settings; it is now under Event.
- Margin / Fill % and slash now use light font weight while numbers stay bold.
- Added Files section to each event:
  - upload multiple files
  - files are saved in the event payload
  - rename files
  - open/view files
  - download files
- Redesigned Break-even helper with simple rows:
  - Guests
  - Tickets
  - Avg. bar spend
- Redesigned Organizer and Bar forecast cards.
- All cards except Forecast are collapsed by default.
- Existing Supabase table/schema remains compatible.
