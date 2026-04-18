---
name: sync-protocol-docs
description: Audit and fix all documentation, components, and examples to match the snap protocol schema definitions. Run after any change to component schemas in pkgs/snap/src/ui/.
---

## Overview

This skill ensures every file that references snap protocol values (component props,
variants, sizes, aspect ratios, etc.) stays in sync with the canonical schema definitions
in `pkgs/snap/src/ui/`.

## Step 1: Read the schema source of truth

Read every `.ts` file in `pkgs/snap/src/ui/`, `pkgs/snap/src/colors.ts`,
`pkgs/snap/src/constants.ts`, and `apps/docs/src/lib/version-config.ts`. Extract the
current valid values for each component and the current `DEFAULT_VERSION`:
variants, sizes, weights, aspect ratios, icon names, gap values, orientations, char
limits, grid/bar-chart limits, and default values.

## Step 2: Audit all downstream files

For each schema constant, grep the repo for any value that was removed or renamed. Check
these file groups:

**React components** (`pkgs/snap/src/react/components/`):

- Variant/size/weight maps must only contain current schema values
- Default fallbacks must match schema defaults

**React Native components** (`pkgs/snap/src/react-native/components/`):

- Same as React components

**Server-side HTML renderer** (`pkgs/hono/src/renderSnapPage.ts`):

- Switch cases and style maps must match schema values
- Every component type must have a `case` in `renderElement`

**OG image renderer** (`pkgs/hono/src/og-image.ts`):

- `mapElement` switch and `estimateElementHeight` must cover all component types
- `specToElementList` must recurse into container types (stack, item_group)

**Catalog descriptions** (`pkgs/snap/src/ui/catalog.ts`):

- Description strings must reflect current component capabilities

**Package llms.txt** (`pkgs/snap/llms.txt`):

- All component props, variants, values, and examples must match schema

**Versioned docs** (`apps/docs/src/app/(docs)/{version}/`):

Docs are organized in version folders (`1.0/`, `2.0/`). The default version is set in
`apps/docs/src/lib/version-config.ts`. When syncing, update BOTH version folders — they
share the same component schema but may differ in spec-level details (e.g. auth payload
shape, structural constraints).

For each version folder, check:

- `(home)/page.mdx` — landing page
- `(home)/agents/page.mdx` — agent-oriented entrypoint
- `(spec)/spec-overview/page.mdx` — Overview
- `(spec)/elements/page.mdx` — props tables, variants tables, usage narrative, examples
- `(spec)/buttons/page.mdx` — button variants, defaults, examples
- `(spec)/surfaces/page.mdx` — POST `surface` field (`standalone` vs `cast`) — **v2.0 only**
- `(spec)/actions/page.mdx` — button examples in action demos
- `(spec)/effects/page.mdx` — component usage in examples
- `(spec)/constraints/page.mdx` — char limits and validation rules
- `(spec)/auth/page.mdx` — payload shape (differs between v1 and v2)
- `(learn)/examples/page.mdx` — full snap response examples
- `(learn)/building/page.mdx` — code example
- `(learn)/upgrading/page.mdx` — (v2.0 only) upgrade guide from previous version

**Version-specific differences to maintain**:

- v1.0 auth: `button_index` in payload, no `audience`
- v2.0 auth: `audience`, `user`, and `surface` (`standalone` | `cast`) in payload, no
  `button_index`. Top-level `fid` deprecated in favor of `user.fid`
- v2.0 constraints: structural limits (64 elements, 7 root children, 4 depth, 6 children/container)
- v1.0 constraints: no structural limits

**LLM / agent docs**:

- `apps/docs/public/SKILL.md` — root agent skill (matches default version)
- `apps/docs/public/1.0/SKILL.md` — v1.0 agent skill
- `apps/docs/public/2.0/SKILL.md` — v2.0 agent skill
- `AGENTS.md` — protocol references
- `template/AGENTS.md` — protocol references

When `DEFAULT_VERSION` changes, copy the corresponding versioned SKILL.md to the root.

**llms.txt** (`apps/docs/src/app/llms.txt/route.ts`):

- Dynamic route that concatenates all docs for a given version
- Serves `DEFAULT_VERSION` by default, accepts `?version=X` query param
- 2.0 SKILL.md points agents to `/snap/` docs (default version); markdown content negotiation
  handles version routing automatically

**Integration docs**:

- `MERKLE_INTEGRATION.md` — component type list and count

**Examples**:

- `examples/snap-catalog/src/index.ts`
- `examples/action-showcase/src/index.ts`

## Step 3: Fix mismatches

For each mismatch found:

1. Update the downstream file to use the current schema value
2. For removed values, choose the closest valid replacement
3. For renamed values, use the new name
4. For docs, ensure props tables, variants tables, and examples all match

## Step 4: Verify

Run `pnpm build` to confirm all packages compile. Grep the repo one more time for any
remaining stale values.

## Common pitfalls

- Badge, toggle_group, and item each have their own `variant` prop — don't confuse them
  with button variants when grepping
- Stack `gap: "lg"` is valid (stack uses its own gap values) — don't remove it
- The emulator UI uses `@neynar/ui` component variants (like `variant="ghost"` on
  ColorModeToggle) — these are UI library props, not snap protocol values
- `catalog.ts` description strings are human-readable and can go stale silently
- `bar_chart` and `cell_grid` have their own constraint constants in `constants.ts` —
  check those when auditing the constraints page
- Components can emit events bound via `on.<event>` — these are part of the protocol
  surface even though they aren't in the zod prop schemas. Today both `button` and
  `cell_grid` use `on.press`; keep new component events on the same `press` name when
  the gesture matches. Audit the React + React Native components for the set of
  `emit("…")` calls and make sure each event is documented on the elements page and in
  `llms.txt`.
- Component count strings (e.g. "16 components") appear in multiple places — grep for
  the old count when adding or removing components
- The OG renderer (`og-image.ts`) has its own element mapping separate from the HTML
  renderer — both must be updated when components change
