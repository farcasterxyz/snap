# Snap Template — Agent Notes

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

## Local development

```bash
pnpm install
pnpm dev          # runs on http://localhost:3003
```

Test with: `curl -sS -H 'Accept: application/vnd.farcaster.snap+json' http://localhost:3003/`

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
`buttons[].target` pointing to your HTTPS origin (not `localhost`).

### Note on package versioning

The `@farcaster/snap*` dependencies must always point to public NPM package versions. NEVER use "workspace:\*". This is a template for others to copy.
