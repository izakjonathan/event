# Event Operations System Design System — v60 Cleanup

v60 is the cleaned design-system baseline.

The previous build had many accumulated CSS layers from v47–v59. v60 replaces that stacked override tail with one final clean layer in `app/globals.css`:

```css
/* v60 CLEAN DESIGN SYSTEM LAYER */
```

## Current result

- The pill-app visual direction is preserved.
- Functionality is unchanged.
- Old module classes still work.
- The design system is easier to change from one place.
- CSS length was reduced.
- `!important` usage was significantly reduced.

## Primary token area

Change the look of the whole app from the `:root` block inside the v60 layer.

Important tokens:

```css
--app-color-ink
--app-color-paper
--app-color-primary
--app-color-on-primary
--app-color-accent
--app-color-on-accent

--app-radius-card
--app-radius-section
--app-radius-field
--app-radius-pill

--app-page-max
--app-page-gap
--app-card-pad
--app-section-pad

--app-title-size
--app-title-weight
--app-heading-size
--app-heading-weight
--app-label-size
--app-body-size
--app-number-size

--app-control-height
--app-field-height
```

## Canonical classes for future JSX

Use these for future modules and redesigned markup:

```css
.ds-page
.ds-wrap
.ds-card
.ds-section
.ds-title
.ds-heading
.ds-label
.ds-body
.ds-number
.ds-button
.ds-button-primary
.ds-button-ghost
.ds-button-danger
.ds-field
.ds-invert
.ds-accent
.ds-compact-summary
```

## Legacy class support

The following older classes are still mapped to the same design system:

```css
.passport-card
.system-shell
.system-wrap
.system-hero
.system-kicker
.passport-button
.top-nav-pill
.booking-overview-card
.module-compact-summary
.artist-compact-summary
.bar-panel
.project-panel
.calendar-event-card
artist-submission-card
```

These should not be used for new components. Use `.ds-*` classes instead.

## Recommended agile workflow

For fast redesigns:

1. Change tokens first.
2. Use `.ds-*` classes in new JSX.
3. Avoid module-specific visual CSS unless it is layout-only.
4. Keep module-specific selectors for layout structure only.
5. Add visual design changes to the v60 layer, not scattered through old sections.

## Known reality

The old modules still contain old class names and some Tailwind utility classes. v60 makes them behave through the shared design layer, but a later JSX cleanup could still make the code cleaner.


## v61 module integration

v61 adds `.ds-*` classes directly to module JSX where practical and adds module identity classes:

```css
.module-dashboard
.module-event-planner
.module-artist-booking
.module-artist-management
.module-calendar
.module-bar-planner
.module-project-management
```

Shared patterns now explicitly cover:

```css
.ds-hero
.ds-card
.ds-section
.ds-module-grid
.ds-module-card
.ds-stat-grid
.ds-compact-summary
```

Existing legacy module classes are still supported, but all modules now have a clearer path into the canonical design system.


## v61 module integration

v61 adds `.ds-*` classes directly to module JSX where practical and adds module identity classes:

```css
.module-dashboard
.module-event-planner
.module-artist-booking
.module-artist-management
.module-calendar
.module-bar-planner
.module-project-management
```

Shared patterns now explicitly cover:

```css
.ds-hero
.ds-card
.ds-section
.ds-module-grid
.ds-module-card
.ds-stat-grid
.ds-compact-summary
```

Existing legacy module classes are still supported, but all modules now have a clearer path into the canonical design system.
