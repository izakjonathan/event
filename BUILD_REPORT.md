# Event Operations System v64

Base: v63

## Mono Editorial Grid Redesign

Resources used:
- `variables.css.txt`
- `DESIGN(1).md`
- supplied mono.frm.fm screenshots / reference

This build applies the uploaded Mono design reference across the whole event operations system.

Design direction:
- black / white / charcoal only
- no yellow or red accents
- no gradients
- no shadows
- no rounded corners
- editorial grid structure
- strict borders and visible structural lines
- vertical side rails
- condensed / editorial typography feel using safe font fallbacks
- table-like compact summaries
- black block primary actions
- square inputs and form controls

Functionality unchanged.

System integration:
- The v63 Event Planner design-system cleanup remains active.
- v64 remaps all master `--app-*` tokens to the uploaded Mono variables.
- All modules use the same mono editorial grid layer.

Build status:
- `npm run build` passed.
