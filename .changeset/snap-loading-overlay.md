---
"@farcaster/snap": minor
---

Add `loadingOverlay?: ReactNode` prop to SnapView and SnapCard (v1/v2, web + react-native) so host apps can replace the built-in loading UI while `loading` is true. Pass `null` to render nothing, or any ReactNode to replace the default spinner. The overlay now renders at the card level so it covers the full card (border + padding + content), not just the padded view area.
