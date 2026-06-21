# Event Operations System Design System — v72

v72 is the current design-system cleanup baseline.

## CSS structure

`app/globals.css` now contains:

1. Tailwind imports
2. `v72 MINIMAL BASE`
3. retained v27+ legacy module structure
4. `v71 CONSOLIDATED PRODUCT DESIGN SYSTEM`

## Active design direction

Neutral product UI:

- rounded cards
- subtle borders
- soft shadows
- compact controls
- quiet hierarchy
- monochrome / neutral
- shadcn/Rhea-inspired app components

## Active tokens

Use the product tokens inside the consolidated layer:

```css
--product-bg
--product-surface
--product-surface-soft
--product-ink
--product-muted
--product-border
--product-border-strong
--product-black
--product-white
--product-radius-xl
--product-radius-lg
--product-radius-md
--product-shadow-soft
```

## Canonical classes

Use these for all new/rebuilt UI:

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
.ds-field
.ds-compact-summary
```

## Current redesigned modules

- Landing page
- Event Planner

## Modules still requiring product UI rebuild

- Bar Planner
- Artist Management
- Calendar / Schedule
- Project Management
- Artist Booking

## Cleanup rule

Do not add stacked visual experiments again.

For the next redesign:
- build with canonical classes
- add only module-specific layout CSS
- keep visual styling controlled by product tokens
