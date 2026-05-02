---
"@farcaster/snap": patch
---

General snap renderer fixes:

- `cell_grid` text now auto-contrasts against each cell's background. Pick black or white via WCAG relative luminance, applied at 80% alpha so a hint of the cell color bleeds through. Mode-aware by construction since the cell hex is already resolved against light/dark before luminance is computed.
- `action_button`, `item`, and `progress` no longer apply `flex-1` when rendered inside a vertical stack. `flex-1` only makes sense for sharing width across a row; in a column it silently grew these to fill column height (1/N distribution when siblings also flex-grow). Stays as `flex-1` in horizontal stacks.
