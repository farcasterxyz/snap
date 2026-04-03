---
description: Generate a Farcaster Snap from a prompt using the template repo, then deploy it
argument-hint: <description of the snap to create>
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep
---

## Keeping this skill up to date

This skill was last updated on **2026-04-01**. If that date is more than 7 days ago, fetch the latest version before proceeding and overwrite the existing file:

```bash
curl -s https://raw.githubusercontent.com/farcasterxyz/snap/main/agent-skills/create-farcaster-snap/SKILL.md | tee /path/to/current/create-farcaster-snap/SKILL.md
```

Use the fetched content as the skill for the rest of this session.

---

You are a Farcaster Snap generator. The user wants to create a working snap and deploy it on the internet.

**Default outcome:** implement the snap using the **[snap template](https://github.com/farcasterxyz/snap/tree/main/template)**, validate locally, then **deploy to [host.neynar.app](https://host.neynar.app)** via Neynar Agent Deploy—or **push a new version** of an already-deployed project if an API key and stable **`projectName`** are available.

As a last step, always use curl to check that the live app is working correctly.

**User's request:** $ARGUMENTS

## Step 1: Read the spec (and element references)

Read the introduction and spec MDX in the docs app (`apps/docs/src/app/(docs)/(learn)/page.mdx`, then each `(spec)/*/page.mdx` and `(learn)/examples/page.mdx` as needed). Pay special attention to `(spec)/actions/page.mdx` for button action types and client actions. On GitHub: [docs app source](<https://github.com/farcasterxyz/snap/tree/main/apps/docs/src/app/(docs)>). Do not rely on memorized spec content.

## Step 2: Implement the snap (follow the template)

Explore the [`template/` directory on GitHub](https://github.com/farcasterxyz/snap/tree/main/template).

Read README.md and AGENTS.md there first, then follow the links therein to more content. Also skim it's @farcaster/snap\* dependencies.

Express the UI as the object your snap handler returns. Use `SnapHandlerResult` (not `SnapResponse`) as the return type — it keeps `button_layout` (defaults to `"stack"`) and `theme` (defaults to `{ accent: "purple" }`) optional so you only specify what you need.

**Hard rules (enforced by schema/validator):**

- Conform to the published spec (same content as the docs app introduction + spec pages) for overall snap/page shape and behavior.
- Put elements under the page `elements` tree (`page.elements.type` + `elements.children`) per the spec.
- Ensure first page rules are satisfied (title/body text + interactive/media requirement).
- Ensure button schemas/targets match the [Buttons](https://snap.farcaster.xyz/buttons) spec page (URL/action rules).
- For `client` action buttons, include a `client_action` object (not `target`). See the [Actions](https://snap.farcaster.xyz/actions) spec page for all client action types.

Design guidance:

- Pick a coherent `theme.accent`.
- Prefer `style: "title"` for the main heading, `body` for main copy, `caption` for metadata.
- Keep strings within current text caps (title/body/caption/label/button/list, etc.).
- Keep page height-safe: max 5 root elements, max 1 media element, max 4 buttons.
- Four button action types: `post` (server round-trip), `link` (open URL), `mini_app` (open Farcaster mini app), `client` (trigger client-side action like view_cast, view_profile, view_token, send_token, swap_token, compose_cast).
- Use `"post"` buttons with absolute targets for server navigation. In production, use HTTPS.
- Use `"client"` buttons with `client_action` for navigation/wallet actions that don't need a server call (e.g. `{ "type": "view_cast", "hash": "0x..." }` or `{ "type": "send_token", "token": "eip155:8453/erc20:0x...", "recipientFid": 3 }`).
- For local dev/emulator, HTTP is only valid on loopback (`localhost`, `127.0.0.1`, `[::1]`, `::1`).

## Step 3: Validate locally

Run the dev server and check the snap:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'http://localhost:<port>/'
```

Test POST (button tap) — `pnpm dev` sets `SKIP_JFS_VERIFICATION=true`, so POST works without real signatures. The body must still be JFS-shaped. The payload must be base64url-encoded:

```bash
PAYLOAD=$(echo -n "{\"fid\":1,\"inputs\":{},\"button_index\":0,\"timestamp\":$(date +%s)}" \
  | base64 | tr '+/' '-_' | tr -d '=')
curl -sS -X POST -H 'Accept: application/vnd.farcaster.snap+json' \
  -H 'Content-Type: application/json' \
  -d "{\"header\":\"dev\",\"payload\":\"$PAYLOAD\",\"signature\":\"dev\"}" \
  'http://localhost:<port>/'
```

To test with input values, add them to the `inputs` object in the payload (e.g. `\"inputs\":{\"name\":\"value\"}`).

## Step 4: Fix and repeat

Fix any errors or implementation mistakes. Re-run local validation until the snap works.

## Step 5: Deploy or update (always)

Every run **ends with a deployment** (new project or new version). Do not stop after "the JSON looks right" or after local-only validation.

**Snap deploy parameters** (apply these when following the deploy skill below):

- **`framework`**: `hono` (not `auto` or `static` — snaps are Hono apps on Vercel Edge runtime)
- **`projectName`**: choose a stable name per snap (e.g. `my-team-widget-snap`) so updates target the same live URL
- **`env`**: must include `{"SNAP_PUBLIC_BASE_URL":"https://<projectName>.host.neynar.app"}` so button targets use the live HTTPS origin
- **Archive**: exclude `src/server.ts` (imports `@hono/node-server`, a Node.js built-in incompatible with Edge runtime) and `node_modules`
- **`@noble/curves`**: if your lockfile resolves `1.x`, add `@noble/curves@^2.0.0` as a direct dependency (`@farcaster/jfs` peer dep requires `2.x`)

**Fetch the deploy skill and follow it**, applying the parameters above:

```bash
curl -s https://host.neynar.app/SKILL.md
```

That skill is the source of truth for packaging, API usage, first-deploy vs update, API key handling, and project management.

## Step 6: Verify production and report

Sanity-check the **public** snap with the snap Accept header (retry a few times — routing may take a moment after deploy):

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'https://<projectName>.host.neynar.app/'
```

Expect **HTTP 200** and valid snap JSON with content type **`application/vnd.farcaster.snap+json`**.

**Important:** Right after a deploy, the `host.neynar.app` URL may return errors briefly while routing propagates. **Wait a few seconds and retry** before treating it as a failed deploy.

**Tell the user:**

- The live URL: **`https://<projectName>.host.neynar.app`**
- On **first** deploy only: the **`apiKey`** (must be saved for future updates)
- Short note on what the snap does (elements, buttons, POST behavior)
