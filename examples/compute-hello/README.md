# Compute Hello — Example Snap

A minimal compute snap that greets the user and counts visits using per-user state.

## Run

Terminal 1 — start the snap server:
```bash
cd ~/src/snap-compute
npx tsx examples/compute-hello/server.ts
```

Terminal 2 — start the emulator:
```bash
cd ~/src/snap-compute
pnpm install
pnpm --filter @farcaster/snap run build
pnpm --filter @farcaster/snap-emulator run dev
```

Then:
1. Open http://localhost:3000
2. Enter URL: `http://localhost:4444`
3. Enter any FID (e.g. `1`)
4. Click **Load**
5. You should see "Hello, FID 1!" with a click counter
6. Click the button — the counter increments locally via the VM (no server round-trip)

## What it demonstrates

- SnapScript compilation to bytecode at server startup
- Bytecode served inline in the snap response (`compute.bytecode`)
- Client-side VM execution (no POST on button press)
- Per-user state (`@state_get` / `@state_set`) for visit counting
- Capability declaration (`user_state`)
- Static fallback UI for non-compute clients
