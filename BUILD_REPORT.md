# Event Operations System v45

Base: v44

Changes:
- Added new Project Management module at `/project-management`.
- Added Project Management card to the dashboard.
- Added Supabase tables for projects and tasks.
- Project fields:
  - project name
  - status
  - priority
  - owner
  - deadline
  - linked event
  - description
  - notes
- Task fields:
  - title
  - project
  - status
  - priority
  - owner
  - due date
  - linked event
  - notes
- Added task board columns:
  - To do
  - Doing
  - Waiting
  - Done
- Added overview cards:
  - Projects
  - To do
  - Doing
  - Overdue
- Added warning chips for missing owners, missing deadlines and overdue tasks.
- Added dashboard / planner / new project top navigation.
