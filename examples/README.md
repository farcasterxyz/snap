# Example apps

Hono-based snap servers for local development and reference. Run from the repo root with `pnpm --filter <name> dev`.

| Example | Port | Description |
|--------|------|-------------|
| `current-time` | 3014 | Minimal snap returning server time as spec-valid JSON |
| `ui-catalog-elements` | 3015 | Multi-page snap exercising catalog elements (Text, Image, Grid, inputs, etc.) |
| `shared-games` | 3011 | Multi-page snap with collaborative game flows (Wordle, canvas, story, etc.) |
| `snap-expression` | 3013 | Dialogue-style snaps (CEO spectrum vote, fund explorer) |
| `two-snaps` | 3016 / 3017 | Two Hono servers for testing cross-snap links in the emulator |

Set `SNAP_PUBLIC_BASE_URL` when deploying so `post` / `link` targets resolve correctly.
