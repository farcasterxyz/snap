---
"@farcaster/snap": patch
---

Polish Snap renderer spacing and image overlay readability.

- Improve React Native image title/subtitle overlays without adding a native gradient dependency: lighter text plate, tighter bottom-left placement, and crisper text shadow.
- Improve web image overlay readability for busy backgrounds.
- Reduce the largest normal-flow Snap text by 1px on web and React Native, including item titles, while leaving image overlay title/subtitle sizing unchanged.
- Make plain item groups with no border and no separator default to zero item gap. Explicit `gap` props continue to take precedence.
