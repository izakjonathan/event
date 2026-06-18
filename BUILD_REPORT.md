# Event Operations System v47

Base: v46

## Design System Refactor

This build adds a shared design-system layer so all modules can be controlled from one place in `app/globals.css`.

### Added central design tokens
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

### Added shared utility classes
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

### Existing module classes now controlled by shared tokens
- Dashboard
- Event Planner
- Artist Booking
- Artist Management
- Calendar / Schedule
- Bar Planner
- Project Management

### Key shared controls
- labels
- headings
- titles
- stat numbers
- money/currency styling
- cards
- border radius
- top nav pills
- form fields
- line width
- color

### Added file
- `DESIGN_SYSTEM.md`

Build notes:
- This keeps the current visual design mostly the same.
- The goal is to stop future modules from creating separate CSS systems.
- Future modules should use the new `.ds-*` utility classes.
