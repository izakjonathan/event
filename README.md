# EventOS v59 — Project Management Upgrade

Project Management is now project-first:

- Create/select a project before creating tasks.
- Every new task is tied to a selected project.
- Selected project shows only its own tasks.
- Project overview shows project stats, progress, active tasks, doing/done/overdue counts.
- Tasks are grouped inside the selected project by Pending, Doing, Done, and Archived.
- Task settings keeps a project dropdown so tasks can be moved between projects, but no task can be created without a project.
- Deleting a project also deletes its linked tasks locally and in Supabase.
- Kept v58 artist layout fixes, v55 dock position, v54 background safe-area behavior, and UI Studio background image controls.

Verified:

- `npm run typecheck` passes.
- `npm run build` passes.
- All routes build as static pages.
