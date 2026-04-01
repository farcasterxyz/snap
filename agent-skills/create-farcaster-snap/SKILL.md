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

Read `docs/SPEC.md` first, then read every linked doc it references. Do not rely on memorized spec content.

## Step 2: Implement the snap (follow the template)

Explore the [`template/` directory on GitHub](https://github.com/farcasterxyz/snap/tree/main/template).

Read README.md and AGENTS.md there first, then follow the links therein to more content. Also skim it's @farcaster/snap\* dependencies.

Express the UI as the object your snap handler returns.

**Hard rules (enforced by schema/validator):**

- Conform to `docs/SPEC.md` for overall snap/page shape and behavior.
- Put elements under the page `elements` tree (`page.elements.type` + `elements.children`) per the spec.
- Ensure first page rules are satisfied (title/body text + interactive/media requirement).
- Ensure button schemas/targets match `docs/response.md` URL/action rules.

Design guidance:

- Pick a coherent `theme.accent`.
- Prefer `style: "title"` for the main heading, `body` for main copy, `caption` for metadata.
- Keep strings within current text caps (title/body/caption/label/button/list, etc.).
- Keep page height-safe: max 5 root elements, max 1 media element, max 4 buttons.
- Use `"post"` buttons with absolute targets. In production, use HTTPS.
- For local dev/emulator, HTTP is only valid on loopback (`localhost`, `127.0.0.1`, `[::1]`, `::1`).

## Step 3: Validate locally

Run the dev server and check the snap:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'http://localhost:<port>/'
```

## Step 4: Fix and repeat

Fix any errors or implementation mistakes. Re-run local validation until the snap works.

## Step 5: Deploy or update (always)

Every run **ends with a deployment** (new project or new version). Do not stop after “the JSON looks right” or after local-only validation.

Fetch and follow the deploy skill:

```bash
curl -s https://host.neynar.app/SKILL.md
```

That skill is the **single source of truth** for packaging, API usage, first deploy vs update, API key handling, and project management. Follow it exactly. The rest of this section covers only **snap-specific** context the deploy skill doesn't know about.

### Snap-specific deploy settings

- **`framework=hono`** — snaps use Hono on Vercel Edge runtime. This means no Node.js built-ins or native modules in the deployed bundle. Keep `src/server.ts` (which imports `@hono/node-server`) out of the deploy archive — it's for local dev only.
- **`SNAP_PUBLIC_BASE_URL`** — pass this in the `env` field so button targets point to the live HTTPS origin, not `localhost`. Set it to `https://<projectName>.host.neynar.app`.

  ```bash
  -F 'env={“SNAP_PUBLIC_BASE_URL”:”https://my-snap.host.neynar.app”}'
  ```

- **`@noble/curves` peer dependency** — `@farcaster/jfs` declares `@noble/curves@2.x` as a peer dep. If your lockfile resolves `1.x` instead, add `@noble/curves@^2.0.0` as a direct dependency in `package.json` before bundling.

## Step 6: Verify production and report

Sanity-check the **public** snap with the snap Accept header (retry a few times — routing may take a moment after deploy):

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'https://<projectName>.host.neynar.app/'
```

Expect **HTTP 200** and valid snap JSON with content type **`application/vnd.farcaster.snap+json`**.

**Tell the user:**

- The live URL: **`https://<projectName>.host.neynar.app`**
- On **first** deploy only: the **`apiKey`** (must be saved for future updates)
- Short note on what the snap does (elements, buttons, POST behavior)
