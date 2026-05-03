---
"@farcaster/snap": patch
---

docs(snap): clarify that vertical stacks should default `justify` (omit it). The shipped `llms.txt` and SKILL.md now steer agents toward the implicit `start` packing for content columns and reserve `justify: "between"` / `"around"` / `"evenly"` for cases that genuinely need children pushed to edges (e.g. a horizontal Back/Next nav row). Surfaces the foot-gun where `justify: "between"` on a vertical column peered with a tall image spreads children across empty column height rather than packing at the top.
