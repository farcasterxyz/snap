---
description: Generate a Farcaster Snap from a prompt using the template repo, then deploy it
argument-hint: <description of the snap to create>
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep
---

You are a Farcaster Snap generator. The user wants you to create valid Snap based on their prompt and deploy it to host.neynar.app

**User's request:** $ARGUMENTS

---

## Keeping this skill up to date

This skill was last updated on **2026-03-27**. If that date is more than 7 days ago, fetch the latest version before proceeding:

```bash
curl -s https://raw.githubusercontent.com/farcasterxyz/snap/main/agent-skills/create-farcaster-snap/SKILL.md
```

Use the fetched content as the skill for the rest of this session.

## Step 1: Read the spec (and element references)

Read `docs/SPEC.md` first, then read every linked doc it references. Do not rely on memorized spec content.

## Step 2: Generate JSON that matches the current page model

The response body is a **root object** (often typed `SnapRoot` in code), not a bare `page`:

```json
{
  "version": "1.0",
  "page": {
    "theme": { "accent": "purple" },
    "button_layout": "stack",
    "elements": {
      "type": "stack",
      "children": [
        /* elements; see docs/response.md */
      ]
    },
    "buttons": [
      /* buttons; see docs/response.md */
    ]
  }
}
```

Use these code sources of truth while building:

- Runtime + type exports: `pkgs/snap/src/index.ts`
- Zod schemas and constraints: `pkgs/snap/src/schemas.ts`
- Canonical constants (media type, palette, limits): `pkgs/snap/src/constants.ts`

**Hard rules (enforced by schema/validator):**

- Generate JSON that conforms to `docs/SPEC.md` for overall snap/page shape and behavior.
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

## Step 3: Validate

Run the dev server and explore the snap using `curl -sS -H 'Accept: application/json+farcaster-snap' <localhost:port>`

## Step 4: Fix and repeat

Fix any errors or implementation mistakes you find. Re-run validation until the snap works.

## Step 5: Output

Return the final JSON and a short explanation of the stack contents and buttons.

## Step 6: Optional — implement in `template/` and deploy

When the user wants a **live** snap (not just JSON), use the workspace package **`snap-template`** (`template/`).

- Implement or change snap behavior in **`template/src/app.ts`** (Hono app, `registerSnapHandler` callback).
- Local dev: **`pnpm --filter snap-template dev`** runs **`src/server.ts`** (default port **3003**).
- **Vercel / edge:** **`template/src/index.ts`** wires the same Hono app via `hono/vercel` (`handle`) for `GET`/`POST` exports — match whatever your host expects (see **`template/README.md`**).
- Set **`SNAP_PUBLIC_BASE_URL`** to your deployment origin (no trailing slash) so `page.buttons[].target` URLs resolve correctly.
- For local POST testing, set **`SKIP_JFS_VERIFICATION=1`**.

Deploy (e.g. host.neynar.app): follow **`template/README.md`** — use the **`hono`** framework for this template, not Vite.

After deploy, sanity-check with:

```bash
curl -sS -H 'Accept: application/json+farcaster-snap' 'https://<your-deployment-origin>/'
```

You should get valid JSON with content type `application/json+farcaster-snap`.
