# v47 Design System

This build adds a shared design-system layer at the end of `app/globals.css`.

## Main token controls

Change these in `:root` to affect the whole app:

- `--ds-ink`
- `--ds-ink-rgb`
- `--ds-paper`
- `--ds-line`
- `--ds-card-radius`
- `--ds-card-radius-sm`
- `--ds-card-padding`
- `--ds-title-size`
- `--ds-heading-size`
- `--ds-label-size`
- `--ds-number-size`
- `--ds-pill-height`
- `--ds-field-height`

## Shared utility classes for new modules

- `.ds-page`
- `.ds-wrap`
- `.ds-card`
- `.ds-section`
- `.ds-title`
- `.ds-heading`
- `.ds-label`
- `.ds-body`
- `.ds-number`
- `.ds-pill`
- `.ds-field`

## Existing module aliases

The design system also controls existing module classes such as:

- `.system-shell`
- `.system-wrap`
- `.passport-card`
- `.system-hero`
- `.booking-overview-card`
- `.top-nav-pill`
- `.public-artist-hero`
- `.bar-forecast-card`
- `.bar-panel`
- `.project-hero`
- `.project-panel`
- `.calendar-event-card`
- `.money-inline`
- `.money-number`
- `.money-currency`

Future modules should use the `ds-*` classes first and only add small module-specific layout classes when necessary.


## v49 shared compact summaries

Use `.module-compact-summary` for low-emphasis module metrics that should fit on one row.

Used in:
- Artist Management style pattern
- Project Management
- Calendar / Schedule

Bar Planner top metric cards now explicitly use:
- `--ds-card-radius-sm`
- `--ds-card-padding`
- `--ds-label-size`
- `--ds-number-size`
- `--ds-number-weight`
