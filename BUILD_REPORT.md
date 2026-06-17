# Event Operations System v29

Built from confirmed working v28.

Changes:
- Added real Supabase Storage image upload to `/artist-booking`.
- Artist form now supports uploading an image file, with preview.
- Image URLs still work as optional fallback.
- Added Supabase storage SQL/policies for public `artist-images` bucket.
- Added artist-to-event connection workflow on `/artists`.
- Artist submissions can now be added to an existing Event Planner event.
- Added fee and set-time inputs when attaching an artist to an event.
- Added Artists / Lineup section inside `/event-planner`.
- Connected artist fees now count as event expenses and appear in Forecast as Artist cost.
- Connected artists store in the event payload, keeping the original artist submission separate.
- Event Planner v26 baseline functionality preserved.
