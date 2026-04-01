---
"@farcaster/snap": patch
"@farcaster/snap-hono": patch
---

fix: make button_layout and theme optional in SnapFunction return type

SnapFunction now accepts SnapResponseInput (Zod input type) instead of SnapResponse (Zod output type), so fields with schema defaults like button_layout and theme.accent are optional in handler return values.
