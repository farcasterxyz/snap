---
"@farcaster/snap": minor
---

Infer button-only stack and toggle group orientation from visible label content in the React and React Native components. The components render horizontally only when total visible label text fits these limits: 2 controls <= 20 chars, 3 controls <= 15 chars, 4 controls <= 11 chars, and 5 controls <= 8 chars. Six controls, or any button/toggle set over its limit, renders vertically.

Button-only stacks now default to the `sm` gap when `gap` is omitted, regardless of whether the content resolves horizontal or vertical. Horizontal button-only stacks use content-proportional widths by default, and `equalWidth: true` can be set on a horizontal stack to force equal-width children.
