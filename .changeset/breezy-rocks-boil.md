---
"@farcaster/snap": patch
---

fix(snap): web `text` no longer fills column height inside a vertical stack. The component used `flex-1` to fill horizontal width, which silently set `flex-grow: 1` along the parent's main axis — so when a vertical stack was a peer of a tall element (e.g. a `9:16` image), text children stretched to evenly fill the column instead of stacking at the top with their gap. Switched the vertical-stack class to `min-w-0` only (block elements already fill width via their parent's `w-full`). Native is unaffected since RN text uses explicit `width: "100%"` rather than flex-grow.
