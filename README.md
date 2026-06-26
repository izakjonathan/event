# EventOS v57 — Artist multi-event linking

This build updates Artist Management so each artist can be linked to zero, one, or multiple events.

## Changes

- Artist Management now has a Linked events panel inside each artist card.
- Artists can be linked to events through an event dropdown.
- Artists can be linked to multiple events by choosing multiple events one at a time.
- Artists can be linked to no events by removing all linked event pills.
- Removing a linked event only removes that artist from that event.
- Saving artist edits also updates linked artist details inside linked events.
- The old automatic "add to first event" behavior has been removed.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes.
