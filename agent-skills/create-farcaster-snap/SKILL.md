---
description: Generate a Farcaster Snap from a prompt using the template repo, then deploy it
argument-hint: <description of the snap to create>
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep
---

## Keeping this skill up to date

This skill was last updated on **2026-03-30**. If that date is more than 7 days ago, fetch the latest version before proceeding and overwrite the existing file:

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

Every run **ends with a deplyoment** (new project or new version). Do not stop after “the JSON looks right” or after local-only validation.

Fetch the deploy skill first:

```bash
curl -s https://host.neynar.app/SKILL.md
```

Use `framework=hono`. The Neynar deploy API sends the project to Vercel where
Hono apps run on **Edge runtime** by default. This imposes constraints on what
the bundled function can import (no Node.js built-ins, no native modules). Use
one `POST` with a **`.tar.gz`** of the app—no git or dashboard required.

**Stable `projectName`:** Choose a durable name (alphanumeric + hyphens, 2–100 chars) per snap or product so updates target the same live URL. Example: **`my-team-widget-snap`**.

First deploy (no API key yet): `POST` **without** `Authorization`. The response includes **`apiKey`** **exactly once**—save it (for example **`.agentdeploy`** in the project, gitignored, or a user-provided secret). Also record **`projectName`** and **`projectId`** if you need the management API.

Subsequent deploys (update in place): Same **`projectName`** and tarball, with:

```text
Authorization: Bearer <apiKey>
```

Same multipart body as before (files, framework, env, optional `description`). This creates a **new version** on the same **`https://<projectName>.host.neynar.app`** project.

If the user supplies an existing key and name, **update**; otherwise **create** and **tell them to store the new `apiKey`**.

**Packaging**

1. **Archive contents** — include whatever the project needs to install and build (see its **`README.md`** and file tree: typically **`package.json`**, lockfile, source dirs, config files). **Do not** upload **`node_modules`** .

2. **Create the archive:**

   ```bash
   tar czf /tmp/site.tar.gz -C /path/to/project-or-staging \
     --exclude=node_modules --exclude='.DS_Store' .
   ```

3. **Deploy request** — **`projectName`**, **`env`** as a JSON string (at least **`SNAP_PUBLIC_BASE_URL`** as below).

   **First deploy** (no `Authorization`; response returns **`apiKey`** once). Use **`framework=auto`** below unless the template specifies a different Neynar **`framework`** value.

   ```bash
   curl -X POST https://api.host.neynar.app/v1/deploy \
     -F "files=@/tmp/site.tar.gz" \
     -F "projectName=my-snap" \
     -F "framework=auto" \
     -F 'env={"SNAP_PUBLIC_BASE_URL":"https://my-snap.host.neynar.app"}' \
     -F "description=Short note for deploy history"
   ```

   **Update existing project** (same **`projectName`**, Bearer token from a prior deploy):

   ```bash
   curl -X POST https://api.host.neynar.app/v1/deploy \
     -H "Authorization: Bearer <apiKey>" \
     -F "files=@/tmp/site.tar.gz" \
     -F "projectName=my-snap" \
     -F "framework=auto" \
     -F 'env={"SNAP_PUBLIC_BASE_URL":"https://my-snap.host.neynar.app"}' \
     -F "description=Short note for deploy history"
   ```

4. **Canonical URL** — the response includes a **`url`** (often **`*.vercel.app`**). **`GET /v1/projects/:projectId`** with the Bearer token returns **`currentUrl`**, usually **`https://<projectName>.host.neynar.app`**. Use that origin when communicating the live snap to the user and when setting **`SNAP_PUBLIC_BASE_URL`** on later deploys.

## Step 6: Verify production and report

Sanity-check the **public** snap (retry if needed—see below):

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'https://<projectName>.host.neynar.app/'
```

Expect **HTTP 200** and valid snap JSON, content type **`application/vnd.farcaster.snap+json`**.

**Important:** Right after a deploy, **`https://<projectName>.host.neynar.app`** may return errors briefly while routing or the edge catches up—the **`*.vercel.app`** **`url`** in the response may already return **200**. **Wait a few seconds and retry** (or poll **`GET /v1/projects/:projectId/deploy/:deploymentId`** until **`deployStatus`** is **`ready`**). Do **not** treat immediate errors as a failed deploy.

**Tell the user**

- **`https://<projectName>.host.neynar.app`** (and optionally the raw Vercel **`url`** if useful).
- On **first** deploy only: the **`apiKey`** and that it must be saved for future updates.
- Short note on what the snap does (elements, buttons, POST behavior).

#### Important: `@noble/curves` peer dependency

`@farcaster/jfs` declares `@noble/curves@2.x` as a peer dependency. If your
lockfile resolves `1.x` instead, add `@noble/curves@^2.0.0` as a direct
dependency in `package.json` before bundling.
