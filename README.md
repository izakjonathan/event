# Event Planner Calculator v2

Next.js + Tailwind + Supabase event planning tool for forecasting event revenue, expenses, ticket sales, bar spend, staff cost and profit splits.

## What is new in v2

- Shared workspace links: open the same `?workspace=...` link on different devices to access/edit the same event data.
- Event templates: blank, concert, quiz night, private party, DJ night, football screening and corporate event.
- Scenario mode: low / expected / best-case planning with editable tickets, ticket price, bar spend and expenses.
- Dedicated staff cost calculator.
- Dedicated bar revenue calculator.
- Break-even helper.
- Venue terms / profit split calculator.
- Event statuses: idea, quoted, confirmed, cancelled, completed.
- Collapsible mobile-first sections.
- Copy text summary and CSV export.

## Local setup

```bash
npm install
npm run dev
```

## Vercel environment variables

Add these to Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Then redeploy.

## Supabase setup

Run `SUPABASE_SCHEMA.sql` in Supabase SQL Editor.

The v1 database table still works for v2. No new columns are required because the app stores the event plan in the `payload` JSON field.

## Sharing between devices

Use the Workspace button in the app, then copy the workspace link. Any device opening that same link will use the same Supabase `owner_key` and edit the same event list.

Example:

```txt
https://your-vercel-site.vercel.app?workspace=temple-events
```

## Important security note

This is a simple shared-link setup. Anyone with the workspace link can edit that workspace. Add Supabase Auth later if you need private users, logins or permissions.


## v27 System routes

- `/` — Event system dashboard
- `/event-planner` — Existing Event Planner Calculator module
- `/artist-booking` — Placeholder for future public artist booking form
- `/artists` — Placeholder for future internal artist submissions admin page


## v28 Artist Booking setup

Run the SQL in `SUPABASE_SCHEMA.sql` to add the `artist_submissions` table.

Routes:
- `/artist-booking` — public artist submission form
- `/artists` — internal artist submissions admin/review page

The app uses the existing Vercel env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`


## v29 Artist images + event lineup

Run the updated `SUPABASE_SCHEMA.sql` in Supabase.

New:
- `/artist-booking` supports real image file upload to Supabase Storage bucket `artist-images`.
- `/artists` lets you add an artist submission to an existing event.
- `/event-planner` now includes an Artists / Lineup section.
- Connected artist fees count as event expenses.


## v30 Booking workflow polish

New admin workflow:
- Edit artist submissions on `/artists`
- Archive/reject artists without deleting their records
- See booked/linked artists overview
- Filter linked and unlinked artists
- See which event an artist is connected to
- Duplicate artist-to-event links are blocked before saving


## v31 Public artist form polish

- `/artist-booking` is now a standalone public form with no dashboard link.
- `/artists` has a “Copy artist form link” button for sharing the public form with artists.


## v32 Artist form scale fix

`/artist-booking` has been hard redesigned with unique `public-artist-*` classes so it no longer inherits the oversized system dashboard hero styling.


## v33 Artist Submissions top pills

The `/artists` top controls are now forced into a single 3-column mobile row:
Dashboard / Copy artist form link / Reload


## v34 changes

- Default ink color is now `#5c0701`.
- Landing page only shows Event Planner and Artist Management.
- Public Artist Booking is hidden from the dashboard and shared from Artist Management via copy link.
- Artist Management cards are collapsible.
- Event Planner top nav has Dashboard / Event / Settings.


## v35 Artist Management refinements

- Artist Management top controls now match Event Planner top pills.
- Artist cards no longer repeat artist names inside expanded content.
- Artist availability now has start time and end time fields.
- Run updated `SUPABASE_SCHEMA.sql` to add:
  - `availability_start_time`
  - `availability_end_time`


## v36 Calendar / Schedule

New route:
- `/calendar`

The Calendar / Schedule module shows:
- all saved events from Supabase
- event status, date, time and location
- linked artists with start/end times and fee
- missing-info warnings
- quick navigation to Dashboard, Event Planner, Artist Management and copy artist form link


## v37 + v38 Bar Planner and Menu Builder

New route:
- `/bar-planner`

The module is connected to events and saves data into `event_plans.payload.barPlanner`.

Includes:
- product library
- buy/sell price
- expected quantity
- revenue/cost/profit/margin calculations
- staffing cost
- event menu builder
- menu preview
- copy menu
- bar notes


## v39 Bar Planner UI match

The Bar Planner has been restyled to better match Event Planner:
- Forecast-style top card
- three top pills
- smaller typography
- tighter mobile spacing
- denser cards and inputs


## v40 Bar Planner title spacing fix

The Bar Planner top title now uses a smaller, controlled size and normal line-height so event names do not create huge vertical gaps.


## v41

This build refines Bar Planner currency styling and redesigns Artist Management fee/time display and top summary layout.


## v42 Bar Planner money cleanup

Bar Planner money values now keep bold/dark numbers and light `DKK` suffixes without nested inner pill/card styling.


## v44 Bar Planner product totals hard fix

The product totals now directly override the old nested span/card CSS so Revenue, Cost, Profit and Margin display as clean Event Planner-style stat cards.


## v45 Project Management

New route:
- `/project-management`

Run updated `SUPABASE_SCHEMA.sql` before testing.

Includes:
- project list
- create/edit/remove projects
- task board
- task status columns
- priority, owner and deadline fields
- linked events
- warnings for overdue/missing info


## v46 Artist Booking scale fix

The public `/artist-booking` form now uses a hard-scoped `artist-booking-scale-fixed` layout to stop inherited oversized hero styles.


## v47 Design System Refactor

A shared design-system layer has been added to `app/globals.css`.

Change the `--ds-*` tokens once to affect the whole system:
- color
- card radius
- labels
- headings
- titles
- stat numbers
- field size
- top pill size
- spacing

A new `DESIGN_SYSTEM.md` file explains the shared classes and tokens for future modules.


## v48 Artist Management compact summary

Artist Management now uses one compact low-emphasis summary strip instead of large stat cards.


## v49 Compact summaries + Bar Planner design token linking

Project Management and Calendar / Schedule now use a shared compact summary strip.

Bar Planner top metrics now explicitly inherit the shared design-system controls for labels, numbers, card radius and card padding.


## v50 Bar Planner collapsible cards

Bar Planner now has collapsible Products, Staff plan, Menu builder and Bar notes sections. Individual product cards are also collapsible and show only the product name when collapsed.


## v51 Collapsible Calendar + Project Management

Bar Planner section headers now use the order `Title - Action - Expand/Collapse`, with the expand/collapse symbol always on the far right.

Calendar event cards and Project Management panels/task cards are now collapsible.


## v52 Project Management Reminders/Trello redesign

Project Management is now task-first:
- Tap Add task
- Edit task settings
- Save task
- Task appears in the right board column

Statuses:
- Pending
- Doing
- Done
- Archived

Run the updated `SUPABASE_SCHEMA.sql` before using image URLs in tasks.


## v53 Project Management mobile cleanup

Project Management task boards now stack vertically, tasks are full-width, status changes use a dropdown, the Open Tasks top pill is removed, and the task settings modal is fixed so it cannot scroll horizontally.


## v54 Full design polish

This version adds a full sitewide design polish layer:
- calmer cards
- more consistent labels/headings
- cleaner buttons and fields
- tighter mobile spacing
- fewer visual nested-card effects
- stronger overflow protection
- improved Project Management / Calendar / Bar Planner polish


## v55 App-like negative color polish

This version adds selective negative colors across the site:
- red backgrounds
- beige text
- stronger app-like hierarchy

Used for primary actions, compact summaries, selected states, collapsed controls, projected profit, date tiles, task status controls and modal actions.


## v56 Design System Ready

This version prepares the whole app for a future full redesign.

A master `--app-*` token layer has been added at the end of `app/globals.css`, and old `--ds-*` / module classes now point back to those controls.

New future modules should use the `.ds-*` classes documented in `DESIGN_SYSTEM.md`.


## v57 Design-system audit

This version audits and hardens the v56 design-system setup.

Important:
- UI Studio now updates the master `--app-*` tokens.
- Node engine is set to `24.x`.
- `DESIGN_AUDIT.md` documents the readiness check.
- The app is ready for the planned full redesign.


## v58 Pill App Redesign

This version applies a full visual redesign inspired by the uploaded mobile reference:
- black primary action bars/buttons
- off-white canvas
- yellow selected/highlight pills
- softer cards
- rounded pill controls
- calmer typography

Functionality is unchanged.


## v59 verified pill redesign

A review found that the v58 redesign CSS was missing from `app/globals.css`.

v59 fixes this by adding the verified pill-app redesign layer to the actual CSS source.


## v60 Design System Cleanup

v60 is the cleaned design-system baseline.

The accumulated v47–v59 CSS override tail has been replaced with one cleaner final v60 design-system layer.

The pill-app redesign remains active, but the CSS is now easier to change from one place.


## v61 Unified Module Design System Integration

All modules are now integrated into the same design-system expression.

The build adds `.ds-*` classes to module JSX where practical and applies unified styling for:
- top navigation
- heroes
- cards
- sections
- compact summaries
- stats
- collapsible headers
- fields
- buttons
- list cards


## v61 Unified Module Design System Integration

All modules are now integrated into the same design-system expression.

The build adds `.ds-*` classes to module JSX where practical and applies unified styling for:
- top navigation
- heroes
- cards
- sections
- compact summaries
- stats
- collapsible headers
- fields
- buttons
- list cards


## v62 Unified Visual Expression Fix

This version fixes remaining visual inconsistencies after v61.

It forces Event Planner and the other modules into the same black/off-white/yellow pill-app design system and fixes invisible text in primary top-nav pills.


## v63 Event Planner Design-System Completion

This version completes the Event Planner cleanup.

Event Planner is now wired into the same design-system contracts as the rest of the modules and is prepared for the next big redesign.


## v64 Mono Editorial Grid Redesign

v64 applies the uploaded Mono reference system-wide:
- black/white/charcoal only
- editorial grid
- vertical side rails
- zero radius
- square form fields
- black primary blocks
- no shadows or gradients

Functionality is unchanged.


## v65 Neo-brutalist redesign phase 1

Landing page and Event Planner redesigned in a monochrome neo-brutalist app style.

Functionality unchanged.


## v66 Neo-brutalist Phase 1 Polish

Refines the Landing page and Event Planner based on mobile screenshots.


## v67 Neo-brutalist mobile hard fix

Polishes the Landing page and Event Planner based on screenshots.
