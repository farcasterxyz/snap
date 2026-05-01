---
"@farcaster/snap": minor
---

Add optional `value` field to `cell_grid` cells. When set, the cell's `value` (string, 1–30 chars) is what's written to `inputs[name]` on press or selection. When omitted, the existing `"row,col"` fallback applies. This removes a recurring foot-gun for grids with meaningful labels (calendar days, alphabet letters, region codes) where action handlers previously had to reverse-lookup row/col into the cell's label.
