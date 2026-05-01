---
"@farcaster/snap": minor
---

Tighten horizontal stack gap scale and add column-aware defaults. Horizontal `gap` now resolves to `none/sm/md/lg = 0/4/8/16 px` (down from `0/4/8/12`; `lg` grows by 4px, `sm`/`md` grow lighter). When `gap` is omitted on a horizontal stack, the default is chosen by column count: 2 cols → `lg` (16px), 3 cols → `md` (8px), 4+ cols → `sm` (4px), unknown → `md`. Column count comes from `columns` when set, or is inferred from button-row children. Vertical stacks are unchanged. An explicit `gap` always wins.
