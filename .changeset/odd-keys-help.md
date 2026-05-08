---
"@farcaster/snap": patch
---

Add cell_grid textColor override

cell_grid cells now accept an optional textColor field alongside color. textColor accepts the same palette color names and #rrggbb hex values as cell fill colors, and it is intentionally an override only: when textColor is omitted, web and native renderers keep using the existing auto-contrast text color derived from each cell background.

The React web and React Native cell_grid renderers both resolve textColor through their existing palette/hex color resolvers before falling back to readableTextOnHex for colored cells and the normal theme text color for uncolored cells. This preserves existing snaps while giving games, pixel art, and board UIs a precise per-cell label color control.

Docs, llms.txt, catalog text, schema validation tests, and a cell-grid-text-color example were added to cover the new catalog surface.
