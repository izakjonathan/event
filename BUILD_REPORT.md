# Event Operations System v28

Built from v27 dashboard/modules.

Changes:
- Added real public Artist Booking form at `/artist-booking`.
- Artists can submit:
  - artist name
  - contact name
  - email
  - phone
  - genre/style
  - description/bio
  - image URL
  - Instagram / Spotify / SoundCloud / YouTube / website links
  - availability
  - preferred fee
  - technical requirements
  - hospitality requirements
  - notes
- Added internal Artist Submissions admin page at `/artists`.
- Submissions page loads from Supabase, displays artist cards and allows status updates.
- Added filters for all/new/interested/contacted/booked/rejected/archived.
- Added Supabase SQL for new `artist_submissions` table.
- Dashboard now marks Artist Booking and Artist Submissions as live modules.
- Event Planner from v26 remains at `/event-planner`.
