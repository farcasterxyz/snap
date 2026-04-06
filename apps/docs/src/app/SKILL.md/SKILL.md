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

This skill was last updated on **2026-04-06**. If that date is more than 7 days ago,
fetch the latest version before proceeding and overwrite the existing file:

```bash
curl -fsSL https://docs.farcaster.xyz/snap/SKILL.md | tee /path/to/skills/farcaster-snap/SKILL.md
```

Use the fetched content as the skill for the rest of this session.

---

Background: Snaps are lightweight interactive apps that render on Farcaster.

Default process:

- implement the snap using the
  [snap template](https://github.com/farcasterxyz/snap/tree/main/template)
- validate locally
- deploy to [host.neynar.app](https://host.neynar.app)
- use curl to check that the live app is working correctly

## Step 1: Read the docs

Read the agent-directed docs at https://docs.farcaster.xyz/snap. Refer to these docs
throughout. Explore them as needed. Do not rely on memorized spec content.

## Step 2: Implement the snap (follow the template)

Explore the
[`template/` directory on GitHub](https://github.com/farcasterxyz/snap/tree/main/template).

Read README.md and AGENTS.md there first, then follow the links therein to more content.
Also skim it's @farcaster/snap\* dependencies.

Express the UI as the object your snap handler returns.

**Hard rules (enforced by schema/validator):**

- Conform to the published spec (same content as the docs app introduction + spec pages)
  for overall snap/page shape and behavior.
- Put elements under the page `elements` tree (`page.elements.type` +
  `elements.children`) per the spec.
- Ensure first page rules are satisfied (title/body text + interactive/media
  requirement).
- Ensure button schemas/targets match the
  [Buttons](https://docs.farcaster.xyz/snap/buttons) spec page (URL/action rules).
- For `client` action buttons, include a `client_action` object (not `target`). See docs
  for all client action types.

Design guidance:

- Pick a coherent `theme.accent`.
- Prefer `style: "title"` for the main heading, `body` for main copy, `caption` for
  metadata.
- Keep strings within current text caps (title/body/caption/label/button/list, etc.).
- Keep page height-safe: max 5 root elements, max 1 media element, max 4 buttons.
- Four button action types: `post` (server round-trip), `link` (open URL), `mini_app`
  (open Farcaster mini app), `client` (trigger client-side action like view_cast,
  view_profile, view_token, send_token, swap_token, compose_cast).
- Use `"post"` buttons with absolute targets for server navigation. In production, use
  HTTPS.
- Use `"client"` buttons with `client_action` for navigation/wallet actions that don't
  need a server call (e.g. `{ "type": "view_cast", "hash": "0x..." }` or
  `{ "type": "send_token", "token": "eip155:8453/erc20:0x...", "recipientFid": 3 }`).
- For local dev/emulator, HTTP is only valid on loopback (`localhost`, `127.0.0.1`,
  `[::1]`, `::1`).

## Step 3: Validate locally

Run the dev server and check the snap:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'http://localhost:<port>/'
```

Test POST (button tap) — `pnpm dev` sets `SKIP_JFS_VERIFICATION=true`, so POST works
without real signatures. The body must still be JFS-shaped. The payload must be
base64url-encoded:

```bash
PAYLOAD=$(echo -n "{\"fid\":1,\"inputs\":{},\"button_index\":0,\"timestamp\":$(date +%s)}" \
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
“the JSON looks right” or after local-only validation.

To deploy, first do `curl -fsSL https://host.neynar.app/SKILL.md`. That skill is the
source of truth for packaging, API usage, first-deploy vs update, API key handling, and
project management. Do not search for other install instructions.

Then use that skill, applying the parameters below:

- **`framework`**: `hono` (not `auto` or `static` — snaps are Hono apps on Vercel Edge
  runtime)
- **`projectName`**: choose a stable name per snap (e.g. `my-team-widget-snap`) so
  updates target the same live URL
- **`env`**: must include
  `{“SNAP_PUBLIC_BASE_URL”:”https://<projectName>.host.neynar.app”}` so button targets
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
