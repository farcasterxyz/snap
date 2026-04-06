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

## Handler callback

`registerSnapHandler` calls your function with a `SnapContext` value (conventionally named `ctx`): `{ action, request }`.

- `ctx.action.type === "get"` — first page load (GET request). No other fields on the action object.
- `ctx.action.type === "post"` — user interaction (POST request). Includes `inputs` (Record of input name → value), `fid` (user's Farcaster ID), `button_index` (which button was tapped), and `timestamp`.

Check `ctx.action.type` before accessing `inputs` — it only exists on `"post"` actions.

### Optional data persistence

The template composes with `createTursoDataStore` . It injects `data` (a key-value `DataStore` from `@farcaster/snap-turso`) before your handler runs. Remove that code if you do not need storage; the base `SnapFunction` type from `@farcaster/snap` does not handle storage.

## Local development

```bash
pnpm install
pnpm dev          # runs on http://localhost:3003
```

Test GET (first page): `curl -sS -H 'Accept: application/vnd.farcaster.snap+json' http://localhost:3003/`

Test POST (button tap): `pnpm dev` already sets `SKIP_JFS_VERIFICATION=true`, so POST works without real signatures. The body must still be JFS-shaped (header/payload/signature strings). The payload must be base64url-encoded (no `+`/`/`/`=`):

```bash
PAYLOAD=$(echo -n "{\"fid\":1,\"inputs\":{},\"button_index\":0,\"timestamp\":$(date +%s)}" \
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

First, get the deploy skil: `curl -s https://host.neynar.app/SKILL.md`. Treat that as authoritative over the instructions below.

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
