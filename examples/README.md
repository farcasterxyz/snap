# Example apps

Hono-based snap servers for local development and reference. Run from the repo root with `pnpm --filter <name> dev`.

| Example | Port | Description |
|--------|------|-------------|
| `simple-snap` | 3012 | **Text + spacer + divider only** — minimal smoke test |
| `current-time` | 3014 | Minimal snap returning server time as spec-valid JSON |
| `ui-catalog-elements` | **3015** | **Universal catalog** for **web** and **native**: every element type across **8** short pages (POST **Next page**). Spec limits: ≤5 root children, one of `image` \| `grid`, ~500px height — see `src/app.ts`. |
| `shared-games` | 3011 | Multi-page snap with collaborative game flows (Wordle, canvas, story, etc.) |
| `snap-expression` | 3013 | Dialogue-style snaps (CEO spectrum vote, fund explorer) |
| `two-snaps` | 3016 / 3017 | Two Hono servers for testing cross-snap links in the emulator |

Set `SNAP_PUBLIC_BASE_URL` when deploying so `post` / `link` targets resolve correctly.
