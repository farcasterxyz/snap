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

- Hono app with `@farcaster/snap-hono` (`registerSnapHandler`) for GET/POST handling and validation
- Vercel entrypoint at `api/index.ts`
- `registerSnapHandler` verifies JFS signatures in production (`NODE_ENV=production`); locally it skips verification for the same JFS-shaped dev envelope the emulator sends (override with `SKIP_JFS_VERIFICATION=no` to require verification, or `=yes` to force bypass)
- Vercel deployment via `vercel.json`

## Endpoints

- `GET /` without `Accept: application/json+farcaster-snap` returns a short plain-text hint for browsers
- `GET /` with the snap Accept header returns the first page (counter demo starting at 0)
- `POST /` accepts a JFS-shaped snap interaction payload (signature verified in production only by default) and returns the next page
- Response pages are kept within current spec limits (max 5 elements, text length constraints)

## Local development

```bash
pnpm install
pnpm dev
```

The server runs on `http://localhost:3003` by default.

## Deploying

The fastest way to deploy is using https://host.neynar.app. Tell your agent to read [SKILL.md](https://github.com/neynarxyz/neynar-deploy/blob/main/SKILL.md) and then deploy with `framework=hono`.
