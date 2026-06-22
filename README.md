# EventOS v20 — Navigation animation fix

This build reviews and fixes the navigation animation layer from v19.

## What changed

- Replaced the old very subtle animation layer with stronger, visible motion.
- Page route changes now animate with a clearer fade, slide and slight scale.
- Page cards now stagger in correctly by targeting the real page structure.
- Dock active state is now visibly animated with lift, scale, icon motion and an active dot.
- Press/tap feedback is applied consistently to buttons, links, cards and accordion headers.
- Replaced native `<details>` sections with a controlled accordion component so open/close animation works reliably.
- Accordion panels now animate height, opacity and position.
- Kept reduced-motion support.
- Production build confirmed with `npm run build`.

## Notes

If iOS Reduce Motion is enabled, the app intentionally disables most motion.
