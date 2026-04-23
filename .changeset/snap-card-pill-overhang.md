---
"@farcaster/snap": patch
---

fix(snap): absorb `<SnapCard />` "Show more" pill overhang internally

The v2 Show more/less pill is positioned `bottom: -14`, straddling the card's bottom border. Any consumer wrapping `<SnapCard />` in a clipping (`overflow: hidden`) rounded container was losing the pill's bottom half — a bug shipped in Farcaster's mobile client.

The component now reserves that 14px of space itself (conditional on the pill actually rendering), in both the React Native and web builds. Short non-overflowing snaps get zero extra space. `plain` and `showOverflowWarning` modes are unchanged.

Migration: if you added your own `paddingBottom: 14` wrapper around `<SnapCard />` to work around this bug, drop it when upgrading — otherwise you'll have doubled overhang.
