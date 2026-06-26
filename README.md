# EventOS v60 — Project Tasks + CSV Import

Project Management update focused on the selected-project task workflow.

## Changes

- Project tasks remain inside one collapsible `Project tasks` card.
- Pending, Doing, Done and Archived groups are collapsible but are not wrapped as nested cards.
- Tasks inside each group render as a clean list with horizontal divider lines.
- Task status is changed with a dropdown: pending, doing, done, archived.
- Task notes now show directly under the task name.
- Each task still has a Settings button for full editing.
- Added CSV import for projects and tasks.
- CSV import can create new projects and tasks tied to each project.
- Manual project/task creation remains unchanged.

## CSV headers supported

`project`, `task`, `notes`, `status`, `priority`, `owner`, `deadline`, `project_status`, `project_priority`, `project_description`, `project_notes`, `task_status`, `task_priority`, `task_owner`, `task_due_date`, `task_notes`, `checklist`, `event`, `image_urls`

Checklist and image URLs can use `|` as a separator.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
- All routes build as static pages.

## v61 project task layout polish
- Project task groups remain collapsible but are no longer visually nested as cards.
- Pending, Doing, Done and Archived groups have clearer section separation.
- Tasks are shown as list rows with horizontal dividers instead of cards.
- Task notes remain visible under the task name.
- Status dropdown and Settings button now share the same height.
- CSV import and manual project/task creation remain unchanged.
