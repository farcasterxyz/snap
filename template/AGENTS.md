# Snap Template — Agent Notes

### IMPORTANT Note on package versioning

Inside the monorepo, `@farcaster/snap`, `@farcaster/snap-hono`, and `@farcaster/snap-turso` use `workspace:*` so the template typechecks against local packages. When you copy this template **outside** the monorepo, replace those with **published semver** ranges from npm (not `workspace:*`).

## Project structure

```
template/
├── src/
│   ├── index.ts     # Hono app + registerSnapHandler callback (edit this); Vercel entry
│   └── server.ts    # Local dev server (@hono/node-server, port 3003)
├── package.json
├── tsconfig.json
└── vercel.json
```

## ESM import rule (IMPORTANT)

**If every route on your deployed snap returns `500 FUNCTION_INVOCATION_FAILED`, check that every local relative import uses a `.js` extension.**

This is an ESM project (`"type": "module"`) with `moduleResolution: "NodeNext"`. All relative imports must include `.js`, even though the source files are `.ts`:

```ts
// ✅ correct
import { thing } from "./thing.js";

// ❌ wrong — fails `pnpm build` (tsc --noEmit); fails on deploy with 500 FUNCTION_INVOCATION_FAILED
import { thing } from "./thing";
```

The extension is required by the Node ESM / Vercel Edge runtime. `tsx` local dev accepts bare imports, so the bug only surfaces on deploy. NodeNext makes `tsc --noEmit` catch it at build time — so always run `pnpm build` before deploying.

Bare package imports (`hono`, `@farcaster/snap`, etc.) do not need an extension.

## Handler callback

`registerSnapHandler` calls your function with a `SnapContext` value (conventionally named `ctx`): `{ action, request }`.

- `ctx.action.type === "get"` — first page load (GET request). No other fields on the action object.
- `ctx.action.type === "post"` — user interaction (POST request). Snap v2 requires `inputs`, `user` (`{ fid }`), `surface` (`standalone` or `cast` with nested `cast` payload), `timestamp`, and `audience`. There is no `nonce` field. Prefer `user.fid`; top-level `fid` is deprecated but may still appear for compatibility. Use different `submit` target URLs (for example query parameters) to distinguish multiple buttons.

Check `ctx.action.type` before accessing `inputs` — it only exists on `"post"` actions.

### Optional data persistence

The template creates a `data` key-value `DataStore` from `@farcaster/snap-turso` (`createTursoDataStore` on Vercel, in-memory otherwise). Wire it into your handler when you need persistence; remove it if unused. The base `SnapFunction` type from `@farcaster/snap` does not include storage.

## Local development

```bash
pnpm install
pnpm dev          # runs on http://localhost:3003
```

Test GET (first page): `curl -sS -H 'Accept: application/vnd.farcaster.snap+json' http://localhost:3003/`

Test POST (button tap): `pnpm dev` already sets `SKIP_JFS_VERIFICATION=true`, so POST works without real signatures. The body must still be JFS-shaped (header/payload/signature strings). The payload must be base64url-encoded (no `+`/`/`/`=`):

```bash
PAYLOAD=$(echo -n "{\"fid\":1,\"inputs\":{},\"audience\":\"http://localhost:3003\",\"timestamp\":$(date +%s),\"user\":{\"fid\":1},\"surface\":{\"type\":\"standalone\"}}" \
  | base64 | tr '+/' '-_' | tr -d '=')
curl -sS -X POST -H 'Accept: application/vnd.farcaster.snap+json' \
  -H 'Content-Type: application/json' \
  -d "{\"header\":\"dev\",\"payload\":\"$PAYLOAD\",\"signature\":\"dev\"}" \
  'http://localhost:3003/'
```

Note: the `timestamp` must be within 300 seconds of the current time (hence `$(date +%s)`).

## Deploying to host.neynar.app (Vercel Edge)

Hono apps on Vercel run on **Edge runtime** (V8 isolates, no Node.js built-ins).
The deploy target is `framework=hono` with entry at `src/index.ts`.

### Deploy

First, get the deploy skill: `curl -s https://host.neynar.app/SKILL.md`. Treat that as authoritative over the instructions below.

Deploy with:

```bash
pnpm install
tar czf /tmp/site.tar.gz .
curl -X POST https://api.host.neynar.app/v1/deploy \
  -F "files=@/tmp/site.tar.gz" \
  -F "projectName=my-snap" \
  -F "framework=hono" \
  -F "env={\"SNAP_PUBLIC_BASE_URL\":\"https://my-snap.host.neynar.app\"}"
```

Save the `apiKey` from the first deploy response — it is shown only once. Show it to the user just in case.

### Environment variables

| Variable                | Required?                 | Description                                                                                                    |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SNAP_PUBLIC_BASE_URL`  | Recommended in production | Canonical HTTPS origin, no trailing slash. If unset, host/proto headers are used; set this for stable targets. |
| `SKIP_JFS_VERIFICATION` | No                        | Set to `true`/`yes`/`1` to skip JFS signature verification. DO NOT SKIP IN PROD                                |

### Verify after deploy

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'https://my-snap.host.neynar.app/'
```

Expect valid JSON with `content-type: application/vnd.farcaster.snap+json` and
button `submit` action targets pointing to your HTTPS origin (not `localhost`).
