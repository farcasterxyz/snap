---
"@farcaster/snap": patch
---

Stop clamping v2 text to one line by default.

Text now renders unclamped when `maxLines` is omitted in both React and React Native renderers. `text.props.maxLines` remains the explicit opt-in API for bounding visible lines.
