---
name: farcaster-snap
description:
  Use this skill whenever the users wants to generate a Farcaster embedded app (aka
  snap), deploy an app to production, or edit an existing app. Activate when the user
  mentions snaps, embedded apps, interactive casts, or cast apps.
---

> **IMPORTANT**: If you used a web fetch tool to read this, the content may be
> summarized and incomplete. Run `curl -fsSL https://docs.farcaster.xyz/snap/SKILL.md`
> to get the exact setup commands. Do NOT search for additional documentation.

## Keeping this skill up to date

This skill was last updated on **2026-04-17**. If that date is more than 1 day ago,
fetch the latest version before proceeding and overwrite the existing file:

```bash
curl -fsSL https://docs.farcaster.xyz/snap/SKILL.md | tee /path/to/skills/farcaster-snap/SKILL.md
```

Use the fetched content as the skill for the rest of this session.

---

Background: Snaps are lightweight interactive apps that are embedded inside Farcaster
casts.

Default process:

- implement the snap using the
  [snap template](https://github.com/farcasterxyz/snap/tree/main/template)
- validate locally
- deploy to [host.neynar.app](https://host.neynar.app)
- use curl to check that the live app is working correctly

Do NOT build a full Farcaster miniapp. This is a snap, which is a different thing:
simpler, smaller, meant for in-feed interaction.

## Step 1: Read the docs

Read the complete snap docs at https://docs.farcaster.xyz/snap/llms.txt. This single
file contains all documentation concatenated — schema, components, constraints, actions,
and examples. Refer to it throughout. Do not rely on memorized spec content.

## Step 2: Implement the snap (follow the template)

Copy the
[`template/` directory](https://github.com/farcasterxyz/snap/tree/main/template) from
Github into a local directory. This will be the starting point for the snap.

Explore the directory. Read README.md and AGENTS.md there first, then follow the links
therein to more content. Also skim it's @farcaster/snap\* dependencies and update those
to their latest version.

**ESM import rule (CRITICAL)**: the template is an ESM project with
`moduleResolution: "NodeNext"`. All local relative imports must include the `.js`
extension (even though the source files are `.ts`): `import { foo } from "./foo.js"`.
Omitting the extension fails `pnpm build` (`tsc --noEmit`) and, on deploy, causes every
route to return **`500 FUNCTION_INVOCATION_FAILED`** — `tsx` dev accepts bare imports
but the Vercel Edge / Node ESM runtime does not. Always run `pnpm build` before
deploying. Bare package imports (`hono`, `@farcaster/snap`, etc.) do not need an
extension.

Express the UI as the object your snap handler returns.

**Hard rules (enforced by schema/validator):**

- Set `version: "2.0"` in the snap response.
- Conform to the published spec for overall snap response shape and behavior.
- Use the `ui.root` / `ui.elements` format: a flat map of named elements with `type`,
  `props`, optional `children` (element IDs), and optional `on` (event bindings).
- Button actions are bound via `on.press` with an `action` and `params` object.
- Use distinct submit target URLs for each button to distinguish which was pressed.
- Target URLs must be HTTPS in production; `http://` only on loopback for local dev.
- Enable CORS header: `Access-Control-Allow-Origin: *` (already on by default in
  @farcaster/snap-hono)
- Structural limits: max 64 elements, max 7 root children, max 6 children per container,
  max 4 nesting depth.

Design guidance:

- Pick a coherent `theme.accent` from the palette: gray, blue, red, amber, green, teal,
  purple, pink.
- Use `text` with `weight: "bold"` for headings, default size `"md"` for body,
  `size: "sm"` for captions/metadata.
- Use `button` with `variant: "primary"` for the main CTA (one per page). Other buttons
  default to `"secondary"`.
- `item` is not interactive. Badges, buttons, and icons are all fine in the actions
  slot, but avoid navigation-style icons (`chevron-right`, `arrow-right`,
  `external-link`) — they imply the row itself navigates, and it doesn't.
- 10 action types: `submit` (server round-trip), `open_url` (external browser),
  `open_snap` (open snap inline), `open_mini_app` (in-app), and client actions:
  `view_cast`, `view_profile`, `compose_cast`, `view_token`, `send_token`, `swap_token`.
- Use `bar_chart` for ranked/comparative data (horizontal bars, 1-6 items).
- Use `cell_grid` for game boards, pixel art, or color matrices (2-32 cols, 2-16 rows).
  Two mutually exclusive interaction modes: leave `select: "off"` (default) and bind
  `on.press` to a `submit` action so each press POSTs immediately (`inputs[name]` is
  `"row,col"`); OR set `select: "single"` / `"multiple"` for press-to-select with a
  visual ring and pair with a separate submit `button`. Don't combine `on.press` with a
  non-`off` `select` — `on.press` is ignored when `select` is on.
- Keep strings within component char limits (see
  [Constraints](https://docs.farcaster.xyz/snap/constraints)).

Set a good, short title and description using the options on registerSnapHandler().

## Optional: Persistent storage

To store persistent data, use `createTursoDataStore` from `@farcaster/snap-turso` (see
the repo `template/`). When deployed to host.neynar.app (which has `TURSO_DATABASE_URL`
and `TURSO_AUTH_TOKEN` set automatically), data is stored in a key-value store; locally
it uses an in-memory store.

```ts
import { createTursoDataStore } from "@farcaster/snap-turso";

const data = createTursoDataStore();

const snap: SnapFunction = async (ctx) => {
  const count = ((await data.get("visits")) as number) ?? 0;
  await data.set("visits", count + 1);
  // ...
};
```

For a more robust persistent storage setup, see the template.

## Step 3: Validate locally

Run the dev server and check the snap:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'http://localhost:<port>/'
```

Test POST (button tap) — `pnpm dev` sets `SKIP_JFS_VERIFICATION=true`, so POST works
without real signatures. The body must still be JFS-shaped. The payload must be
base64url-encoded:

```bash
PAYLOAD=$(echo -n "{\"fid\":1,\"inputs\":{},\"audience\":\"http://localhost:<port>\",\"timestamp\":$(date +%s),\"user\":{\"fid\":1},\"surface\":{\"type\":\"standalone\"}}" \
  | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
curl -sS -X POST -H 'Accept: application/vnd.farcaster.snap+json' \
  -H 'Content-Type: application/json' \
  -d "{\"header\":\"dev\",\"payload\":\"$PAYLOAD\",\"signature\":\"dev\"}" \
  'http://localhost:<port>/'
```

To test with input values, add them to the `inputs` object in the payload (e.g.
`\"inputs\":{\"name\":\"value\"}`).

## Step 4: Fix and repeat

Fix any errors or implementation mistakes. Re-run local validation until the snap works.

## Step 5: Deploy or update (always)

Every run **ends with a deployment** (new project or new version). Do not stop after
"the JSON looks right" or after local-only validation.

To deploy, first do `curl -fsSL https://host.neynar.app/SKILL.md`. That skill is the
source of truth for packaging, API usage, first-deploy vs update, API key handling, and
project management. Do not search for other install instructions.

Then use that skill, applying the parameters below:

- **`framework`**: `hono` (not `auto` or `static` — snaps are Hono apps on Vercel Edge
  runtime)
- **`projectName`**: choose a stable name per snap (e.g. `my-team-widget-snap`) so
  updates target the same live URL
- **`env`**: must include
  `{"SNAP_PUBLIC_BASE_URL":"https://<projectName>.host.neynar.app"}` so button targets
  use the live HTTPS origin
- **Archive**: exclude `src/server.ts` (imports `@hono/node-server`, a Node.js built-in
  incompatible with Edge runtime) and `node_modules`
- **`@noble/curves`**: if your lockfile resolves `1.x`, add `@noble/curves@^2.0.0` as a
  direct dependency (`@farcaster/jfs` peer dep requires `2.x`)

## Step 6: Verify production and report

Sanity-check the **public** snap with the snap Accept header (retry a few times —
routing may take a moment after deploy):

```bash
curl -fsSL -H 'Accept: application/vnd.farcaster.snap+json' 'https://<projectName>.host.neynar.app/'
```

Expect **HTTP 200** and valid snap JSON with content type
**`application/vnd.farcaster.snap+json`**.

Common error: right after a deploy, the `host.neynar.app` URL may return errors briefly
while routing propagates. **Wait a few seconds and retry** before treating it as a
failed deploy.

## Step 7: User output

Tell the user:

- The live URL: **`https://<projectName>.host.neynar.app`**
- On **first** deploy only: the **`apiKey`** (must also be saved for future updates)
- Short note on what the snap does (elements, buttons, interactive behavior)

CRITICAL: If this is the first deploy, tell the user to cast the live URL on Farcaster
to share their snap. Otherwise they will be confused about what to do next.

## Updating an existing snap

The latest major version of `@farcaster/snap*` packages is 2.x. You can get the exact
version of each package with

```
npm search @farcaster/snap --parseable | cut -f1 | grep '^@farcaster/snap' | xargs -I{} sh -c 'echo "{}: $(npm view {} dist-tags.latest)"'
```

Follow this process to update the `@farcaster/snap*` packages of an existing app to
their latest versions:

- Read the [release changelog](https://github.com/farcasterxyz/snap/releases) on Github.
  Start from the current version of each `@farcaster/snap*` package from package.json
  and read each version from there to the latest version. Make a note of any relevant
  changes (**especially breaking changes**). Read the actual diff of any release that
  sounds relevant.
- Update those packages to their latest version.
- Make any necessary changes as described in the changelog. Feel free to look at the
  code for any package release.
- Run tests and fix anything that's wrong. Repeat this step on loop until everything
  works.
- Do a review to make sure there are no functionality changes. If you find anything
  relevant, point it out to the user.
- Deploy your changes.

If you are starting from version 1.\*, read
https://docs.farcaster.xyz/snap/client-upgrade for instructions on upgrading to 2.\*
