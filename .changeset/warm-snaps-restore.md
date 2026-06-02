---
"@farcaster/snap": minor
---

Add restorable Snap render state for React and React Native renderers.

`SnapCard` now accepts `initialRenderState` and `onRenderStateChange` so hosts can remount a Snap without losing JSON-render local state such as inputs, toggles, sliders, cell selections, and paginator page. Remounts also remember which one-shot Snap effects have already been presented, preventing confetti or fireworks from replaying when a host moves the same Snap between inline, focused, or lifted surfaces.
