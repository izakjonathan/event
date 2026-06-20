# Event Operations System Design System — v56 Ready

This build prepares the app for a full redesign.

The goal is that the next redesign can be done mostly by changing tokens in one place instead of editing every module separately.

## 1. Master tokens

The current master tokens are at the end of `app/globals.css` under:

```css
/* v56 DESIGN SYSTEM READY LAYER */
```

Primary tokens:

```css
--app-color-ink
--app-color-ink-rgb
--app-color-paper
--app-color-paper-rgb
--app-color-primary
--app-color-on-primary
--app-color-surface
--app-color-surface-soft
--app-color-border
--app-color-border-strong

--app-radius-card
--app-radius-section
--app-radius-field
--app-radius-pill

--app-line-width

--app-space-1
--app-space-2
--app-space-3
--app-space-4
--app-space-5
--app-space-6

--app-title-size
--app-heading-size
--app-label-size
--app-body-size
--app-number-size

--app-control-height
--app-field-height
```

## 2. Legacy sync

All older variables are now mapped to the master `--app-*` tokens:

```css
--ds-*
--ink
--ink-rgb
--paper
--line
```

This means old modules should still work, but the redesign should start from `--app-*`.

## 3. Canonical classes for future modules

Use these for all new module UI:

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
.ds-compact-summary
```

## 4. Existing module mapping

The v56 CSS maps existing module classes into the same controls, including:

- Dashboard
- Event Planner
- Artist Booking
- Artist Management
- Calendar / Schedule
- Bar Planner
- Project Management

Examples:

```css
.passport-card -> ds-card behavior
.system-hero h1 -> ds-title behavior
.booking-overview-card strong -> ds-number behavior
input/select/textarea -> ds-field behavior
top-nav-pill/passport-button -> ds-button behavior
module-compact-summary -> ds-compact-summary behavior
```

## 5. Redesign process

For the next big redesign:

1. Change the master tokens first.
2. Use `.ds-*` classes for any new or rewritten markup.
3. Avoid writing new colors, font sizes, radii, or button styles inside module-specific CSS.
4. Only use module-specific CSS for layout differences.

## 6. Current deprecated classes

These still work, but should not be used for new components:

```css
.passport-card
.booking-overview-card
.system-kicker
.top-nav-pill
.passport-button
```

Use the `.ds-*` equivalents instead.


## v57 audit note

The Event Planner UI Studio now writes into the master `--app-*` token layer as well as the old fallback variables.

This means live design controls and future redesign tokens now point to the same places.

A full readiness audit is available in:

```txt
DESIGN_AUDIT.md
```
