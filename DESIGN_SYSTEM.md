# Event Operations System Design System — v64 Mono Editorial Grid

v64 uses the uploaded Mono reference as the system-wide design direction.

## Source resources

- `variables.css.txt`
- `DESIGN(1).md`
- mono.frm.fm screenshots/reference

## Visual rules

- Only black, white and charcoal.
- No red.
- No yellow.
- No gradients.
- No shadows.
- No rounded corners.
- Borders and gridlines carry structure.
- Typography carries hierarchy.
- Primary actions are black blocks.
- Inputs are square editorial form cells.
- Compact summaries behave like table rows.
- Pages use vertical side rails.

## Core tokens

```css
--color-paper-white: #ffffff;
--color-charcoal-ink: #292929;
--color-carbon-black: #000000;
```

These are mapped into the app system through `--app-*` variables.

All radii are `0px`.

## Typography

The uploaded font tokens are preserved as variables, but the app uses safe fallbacks unless the custom fonts are added privately in the project. Do not distribute font files unless licensing allows it.

## Redesign readiness

Future redesigns should still happen through the same master `--app-*` tokens, but v64 proves the design system can now support a completely different visual direction across all modules.
