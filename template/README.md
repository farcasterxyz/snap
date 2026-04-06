# Snap Template

Standalone TypeScript + pnpm template for building Farcaster snaps with Hono.

## Use outside this monorepo

To copy this template into a new project (without cloning the whole repo):

```bash
npx degit farcasterxyz/snap/template my-snap
cd my-snap && pnpm install
```

Then set dependencies in `package.json` to published versions of `@farcaster/snap` and `@farcaster/snap-hono` (or keep `workspace:*` only when developing inside the monorepo).

## Stack

- Hono app in **`src/index.ts`** with `@farcaster/snap-hono` (`registerSnapHandler`) for GET/POST handling and validation
- Local server: **`src/server.ts`** (default port **3003**)
- `registerSnapHandler` verifies JFS signatures. For local developopment, use SKIP_JFS_VERIFICATION=true.

## What this starter shows

The first page is a short **onboarding** flow: a topic row and **Refresh** (POST) mirror the **current-time** example pattern—pick a chip, post, and read updated copy. Replace the handler body with your own snap.

## Endpoints

- `GET /` without `Accept: application/vnd.farcaster.snap+json` returns a short plain-text hint for browsers
- `GET /` with the snap Accept header returns the first page
- `POST /` accepts a JFS-shaped snap interaction payload (signature verified in production only by default) and returns the next page
- Response pages follow current spec limits (max 5 elements, text length constraints)

## Local development

```bash
pnpm install
pnpm dev
```

The server runs on `http://localhost:3003` by default.

## Deploying

The fastest way to deploy is using https://host.neynar.app. Tell your agent to read [SKILL.md](https://docs.farcaster.xyz/snap/SKILL.md) and then deploy with `framework=hono`.
