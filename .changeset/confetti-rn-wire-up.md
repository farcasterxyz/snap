---
"@farcaster/snap": patch
---

fix(react-native): wire up `ConfettiOverlay` in `SnapViewCoreInner` so `snap.effects: ["confetti"]` actually renders on mobile. Keyed on a counter so repeat triggers restart the animation, matching web behavior.
