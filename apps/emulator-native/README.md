# @farcaster/snap-emulator-native

Local-only **React Native (Expo)** snap preview: enter a **port** only (defaults to `http://localhost:{port}/`), **GET** with the snap `Accept` header, validate, and render with `@json-render/react-native`. **POST** buttons send the same **dev JFS envelope** as the web emulator (`header` / `signature` placeholders and `encodePayload` from `@farcaster/snap/server`), not real Ed25519 signing.

- **No** `/api/snap` proxy — requests go straight to the upstream URL (no browser CORS on device/simulator).
- Default port **3015** matches **`examples/ui-catalog-elements`** (full catalog; POST **Next page** to cycle). Still stubbed: **BarChart** (web emulator renders it). **TextInput**, **Toggle**, **Slider**, **ButtonGroup**, **Grid**, etc. bind to POST `inputs` like the web emulator.
- Optional **User FID** field controls the `fid` field in POST payloads (default `3` if invalid).

## Prerequisites

- Repo root: `pnpm install`
- `@farcaster/snap` must be built (`pnpm exec turbo build --filter=@farcaster/snap` or any task that depends on `^build`).

## Run

From the repository root:

```bash
pnpm exec turbo typecheck --filter=@farcaster/snap-emulator-native
pnpm --filter @farcaster/snap-emulator-native start
```

Then press `i` / `a` for iOS Simulator or Android emulator, or scan the QR code with Expo Go.

`metro.config.js` uses **`getDefaultConfig` from `expo/metro-config` only** so Expo sets monorepo `watchFolders` and `node_modules` paths. Do not enable `resolver.disableHierarchicalLookup` — pnpm keeps dependencies in nested `.pnpm` trees; Metro must walk them to resolve transitives (`expo-*`, `invariant`, `@ungap/structured-clone`, etc.). If resolution still fails, set `nodeLinker: hoisted` in the repo root `pnpm-workspace.yaml` (see [Expo monorepo + pnpm](https://docs.expo.dev/guides/monorepos/#package-managers-with-isolated-dependencies)).

## Layout

- `src/lib/snapPageToJsonRenderSpec.ts` — copied from the web emulator; the web file is the source of truth.
- `src/features/snap-catalog/` — `createRenderer` map for `snapJsonRenderCatalog`.
- `src/App.tsx` — local port + FID inputs, load, validation, POST/link handling.
