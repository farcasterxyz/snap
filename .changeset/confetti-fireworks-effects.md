---
"@farcaster/snap": minor
---

Add `fireworks` effect + improve confetti physics.

**New `fireworks` effect** — a separate `effects` value (alongside `confetti`) that renders staggered radial bursts: particles explode outward from random viewport positions with a brief flash at the origin, `ease-out` deceleration, and fade. Use as `effects: ["fireworks"]` or combine with confetti via `effects: ["confetti", "fireworks"]`.

**Improved confetti physics** — replaces `ease-in` (which made pieces accelerate like rocks) with `cubic-bezier(0.25,0,0.75,1)` for a natural fast-burst-then-float feel. Each piece now has per-piece sinusoidal lateral drift via CSS custom properties, `rotateY` flutter alongside `rotateZ` tumble, and a mix of circular and rectangular shapes.
