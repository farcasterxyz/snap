---
"@farcaster/snap": patch
---

fix(snap): web SnapText rows hug content like native

Horizontal stack children no longer apply flex-1 to web text; paired labels stay grouped on the left with gap, matching React Native behavior.
