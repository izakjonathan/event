# Event Operations System v57 Design-System Audit

## Result

Ready for the planned full redesign after the fixes in this build.

## Checks performed

- File structure checked.
- Required routes and components checked.
- `package.json` checked and Node engine updated to `24.x`.
- `app/globals.css` design-token layer checked.
- `DESIGN_SYSTEM.md` checked and updated.
- Supabase schema checked.
- Event Planner UI Studio checked and patched so it writes to the new master `--app-*` tokens.
- Legacy `--ds-*`, `--ink`, `--paper` mappings checked.
- Horizontal overflow safety checked and reinforced.
- Build validation performed with `npm run build`.

## Important fixes made

### 1. UI Studio now controls the real design system

Before this audit, Event Planner UI Studio still wrote mainly to older variables such as `--paper`, `--ink`, `--heading-size`, `--number-size`, etc. The v56 design-system layer introduced master `--app-*` tokens, so UI Studio needed to write to those as well.

Fixed: UI Studio now updates:

- `--app-color-paper`
- `--app-color-ink`
- `--app-color-primary`
- `--app-color-on-primary`
- `--app-heading-*`
- `--app-number-*`
- `--app-label-*`
- `--app-body-*`
- legacy `--ds-*`, `--ink`, `--paper` fallback variables

The storage key was bumped to avoid old browser UI settings overriding the new token system.

### 2. Node version aligned

Updated `package.json` engines to:

```json
{"node": "24.x"}
```

### 3. Legacy stat/card classes reinforced

Added a final audit-readiness CSS patch so old classes like `.stat-card`, `.forecast-info-row`, `.booking-overview-card`, `.module-compact-summary`, `.bar-product-total-card`, `.project-status-pill`, etc. all explicitly resolve to canonical `--app-*` controls.

### 4. Redesign safety improved

Added final `min-width: 0` safety across common layout containers to reduce future horizontal overflow when redesigning.

## Token inventory

- Master `--app-*` tokens found: 67

- Legacy `--ds-*` tokens found: 51

- Canonical `.ds-*` classes are documented in `DESIGN_SYSTEM.md`.

## Remaining note

The app still contains older module-specific class names in JSX. That is okay for now because v57 maps those classes into the shared token system. For the big redesign, the best next step is to gradually replace JSX markup with canonical `.ds-*` classes module-by-module.
