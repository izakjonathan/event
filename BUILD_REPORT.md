# Event Operations System v52

Base: v51

Changes:
- Redesigned Project Management closer to Apple Reminders + Trello.
- Top action now says Tap / Add task.
- Add task opens a task settings modal instead of instantly adding a full card.
- Task settings include:
  - title
  - status
  - priority
  - deadline
  - responsible
  - project
  - linked event
  - notes
  - subtasks
  - image URLs
- Task board statuses changed to:
  - Pending
  - Doing
  - Done
  - Archived
- Existing old statuses are normalized:
  - `to-do` → `pending`
  - `waiting` → `pending`
- Tasks appear in the correct board after save.
- Task cards are simplified:
  - completion circle
  - title
  - deadline / responsible / subtask count / image count
  - quick status buttons
- Easy task actions:
  - complete/uncomplete by tapping the circle
  - Pending
  - Doing
  - Done
  - Archive
- Added Supabase column:
  - `image_urls jsonb`
- Build keeps v51 collapsible Bar Planner, Calendar and Project Management structure.
