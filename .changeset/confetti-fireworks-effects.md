---
"@farcaster/snap": minor
---

Add `"fireworks"` as a new `effects` value. Renders 5 staggered radial bursts at random viewport positions — each burst starts with a brief white flash at the origin, then 24 particles fly outward in all directions with per-particle CSS-var trajectories, decelerating via `cubic-bezier(0.2,0,0.8,1)` and fading out. Use as `effects: ["fireworks"]` or combine with confetti via `effects: ["confetti", "fireworks"]`.

Also fix confetti physics. The old animation used `ease-in`, which made pieces accelerate downward like rocks instead of floating. Switched to `cubic-bezier(0.25,0,0.75,1)` for a fast-burst-then-drift feel. Each piece now has a unique lateral sway path via per-piece `--dx`/`--dm` CSS custom properties driving a 6-stop sinusoidal keyframe, `rotateY` added alongside `rotateZ` for paper-flutter, and shapes are now a mix of rectangles and circles.
