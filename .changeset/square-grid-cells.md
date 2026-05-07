---
"@farcaster/snap": minor
"@farcaster/snap-hono": patch
---

Add `cellAspectRatio` support to `cell_grid`.

`cell_grid` now accepts `cellAspectRatio: "square"` to keep each cell square as snap width changes, while preserving the existing `rowHeight` behavior by default. This makes board-style snaps such as Minesweeper render with stable cell geometry across client widths.

The React, React Native, static HTML, and OG image renderers now honor square grid cells. The 2.0 docs, agent-facing skill text, and `llms.txt` reference material document the new option, and a focused `cell-grid-square` example app exercises the behavior in the emulator.
