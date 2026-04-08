# Workspace handbook

Operational facts about this repository: ports, env vars, package behaviors, and build quirks. Read this file when you need a specific detail. For philosophy, principles, and coding conventions, see [`AGENTS.md`](./AGENTS.md).

## Package manager

Use **pnpm**. Do not use npm.

## Local dev ports

| App             | Port  | Command                                                 |
| --------------- | ----- | ------------------------------------------------------- |
| `apps/emulator` | 3000  | `pnpm exec turbo dev --filter=@farcaster/snap-emulator` |
| `template/`     | 3003  | `pnpm dev` (inside `template/`)                         |
| `examples/*`    | 3010+ | Distinct port per example app                           |

## Snap HTTP protocol

- **GET**: send `Accept: application/vnd.farcaster.snap+json`; example servers typically expose JSON on `/snap`, not on bare `/`.
- **POST**: body must be a JFS compact string (`header.payload.signature`). The payload must be base64url-encoded.

## JFS verification (local dev)

`registerSnapHandler` skips JFS **signature** verification when `NODE_ENV` is not `production`, but POST bodies must still be JFS-shaped JSON (`header` / `payload` / `signature`), including from `apps/emulator`.

- Set `SKIP_JFS_VERIFICATION=no` to require verification anyway
- Set `SKIP_JFS_VERIFICATION=yes` or `=1` to force bypass in production (dev-only)
- The handler option is `skipJFSVerification` (exact property name)
- There is no `maxSkewSeconds` option on the handler — post time skew is handled inside `@farcaster/snap` server parsing

## Environment variables

| Variable                | Where                   | Description                                                                                  |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `SNAP_PUBLIC_BASE_URL`  | Snap server             | Canonical HTTPS origin (no trailing slash) so `page.buttons[].target` URLs resolve correctly |
| `SKIP_JFS_VERIFICATION` | Snap server             | `yes`/`1` to bypass JFS verification; do not use in production                               |
| `FARCASTER_HUB_URL`     | Snap server             | Hub URL with port, e.g. `https://rho.farcaster.xyz:3381`                                     |
| `TURSO_DATABASE_URL`    | `@farcaster/snap-turso` | Turso database URL (e.g. `libsql://…`)                                                       |
| `TURSO_AUTH_TOKEN`      | `@farcaster/snap-turso` | Turso database auth token                                                                    |

## Hub connectivity

Snap hub verification uses the Hubble **HTTP** API only (no gRPC). URL helpers accept `http`/`https` with an explicit port or bare `host:port`; `grpc:`/`grpcs:` are invalid.

## Emulator behavior

In `apps/emulator`, **link** buttons first GET `/api/snap?url=…` for the resolved target; if the response is valid snap JSON, the emulator replaces the preview and syncs the Snap URL field, otherwise it opens the link in a new tab.

For local dev on Next.js 16+, use `next dev -p 3000 --webpack` when forcing the Webpack dev server (supported flag). Do not use undocumented flags such as `--no-turbopack`.

## Workspace package resolution

This repo sets `link-workspace-packages=false` in `.npmrc`, so plain semver ranges resolve from npm. Use **`workspace:*`** only when you intentionally want the in-repo package.

For apps installed or copied **outside** this monorepo, prefer **published semver** ranges for `@farcaster/snap` and `@farcaster/snap-hono` on npm.

## json-render catalog

The json-render catalog for snaps lives in `pkgs/snap/src/ui/`. It is exported as `@farcaster/snap/ui` and per-component sub-paths (e.g., `@farcaster/snap/ui/button`). The emulator imports `snapJsonRenderCatalog` from `@farcaster/snap/ui`.

## Data store (`@farcaster/snap-turso`)

Opt-in data persistence lives in `@farcaster/snap-turso`:

- Types: `DataStore`, `DataStoreValue`, `SnapFunctionWithDataStore`
- Helpers: `createInMemoryDataStore()`, `createTursoDataStore(url, token)`
- when hosted via Neynar, uses db-backed storage; otherwise in-memory (for local dev)

## JFS request-body verification

Snap POST authentication uses `verifyJFSRequestBody` from `@farcaster/snap/server` as the single verification path; legacy header/signing verification flows were removed.

- Hub/Node-dependent code lives under `pkgs/snap/src/server/`
- The main `@farcaster/snap` entry does not depend on `@farcaster/hub-nodejs` (safe for browser bundles that only need schemas/validation)
- `@farcaster/snap-hono` uses an internal `payloadToResponse` helper when building `Response`s from `registerSnapHandler`; it is not part of the package's public exports

## Input normalization

`parseRequest` (`@farcaster/snap/server`) decodes the JFS payload and validates it with `payloadSchema` (Zod). No manual coercion is applied — fields that don't match the schema are rejected. Coverage in `pkgs/snap/tests/parseRequest.test.ts`.

## Build system

- `pkgs/snap` uses a post-build ESM import rewrite (`tsc-alias --resolve-full-paths --resolve-full-extension .js`) so Node ESM consumers can resolve `dist/*` imports
- Turbo wires `dependsOn: ["^build"]` on `test`, `typecheck`, and `dev` so workspace packages build before dependents
- `apps/emulator` runs `build:workspace-deps` in `predev` and `prebuild` for `@farcaster/snap`
