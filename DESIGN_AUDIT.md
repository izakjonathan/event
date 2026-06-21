# v72 Design Audit

## Result

v72 is a deeper cleanup build.

The old early Event Planner design CSS has been removed. This was the largest remaining pre-design-system block and was no longer needed after the v70/v71 product UI consolidation.

## Measured cleanup

Compared to v71:

- CSS before: 130,426 characters
- CSS after: 101,894 characters
- Reduced by: 28,532 characters

- `!important` before: 1,100
- `!important` after: 882
- Reduced by: 218

Compared to the pre-cleanup v70 state:

- CSS before v71: 234,213 characters
- CSS after v72: 101,894 characters
- Total reduction: 132,319 characters

## What remains

The remaining legacy CSS is mostly v27+ module structure for modules that have not yet been fully rebuilt into the product UI system.

This is intentional.

Do not remove more legacy module CSS until:
- Bar Planner
- Artist Management
- Calendar
- Project Management
- Artist Booking

have been redesigned structurally.
