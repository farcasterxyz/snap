---
"@farcaster/snap": minor
---

Tighten horizontal stack gap scale and add column-aware defaults. Horizontal `gap` now resolves to `none/sm/md/lg = 0/2/4/8 px` (down from `0/4/8/12`). When `gap` is omitted on a horizontal stack, the default is chosen by column count: 2 cols → `lg`, 3 cols → `md`, 4+ cols → `sm`, unknown → `md`. Column count comes from `columns` when set, or is inferred from button-row children. Vertical stacks are unchanged. An explicit `gap` always wins.
