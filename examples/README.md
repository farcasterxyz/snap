# Example apps

Hono-based snap servers for local development and reference. Run from the repo root with `pnpm --filter <name> dev`.

| Example | Port | Description |
|--------|------|-------------|
| `current-time` | 3014 | Minimal snap returning server time as spec-valid JSON |
| `ui-catalog-elements` | 3015 | Multi-page snap exercising catalog elements (Text, Image, Grid, inputs, etc.) |
| `shared-games` | 3011 | Multi-page snap with collaborative game flows (Wordle, canvas, story, etc.) |
| `snap-expression` | 3013 | Dialogue-style snaps (CEO spectrum vote, fund explorer) |
| `two-snaps` | 3016 / 3017 | Two Hono servers for testing cross-snap links in the emulator |
| `item-media` | 3021 | Focused snap showing `item.props.media` with icon and image rows |
| `cell-grid-square` | 3022 | Focused snap showing square `cell_grid` cells for board games |
| `component-improvements` | 3024 | NEYN-11381 showcase covering paginator, 4:1 image overlays, optional text clamping, compact actions, and dense grids |
| `compact-paginator` | 3025 | Focused snap showing hidden paginator chrome with custom button and `cell_grid` local controls |

Set `SNAP_PUBLIC_BASE_URL` when deploying so `post` / `link` targets resolve correctly.
