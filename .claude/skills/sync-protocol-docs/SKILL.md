---
name: sync-protocol-docs
description: Audit and fix all documentation, components, and examples to match the snap protocol schema definitions. Run after any change to component schemas in pkgs/snap/src/ui/.
---

## Overview

This skill ensures every file that references snap protocol values (component props,
variants, sizes, aspect ratios, etc.) stays in sync with the canonical schema definitions
in `pkgs/snap/src/ui/`.

## Step 1: Read the schema source of truth

Read every `.ts` file in `pkgs/snap/src/ui/`, `pkgs/snap/src/colors.ts`, and
`pkgs/snap/src/constants.ts`. Extract the current valid values for each component:
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

**Home docs** (`apps/docs/src/app/(docs)/(home)/`):

- `page.mdx` — landing page
- `agents/page.mdx` — agent-oriented entrypoint

**Snap spec docs** (`apps/docs/src/app/(docs)/(spec)/`):

- `spec-overview/page.mdx` — Overview
- `elements/page.mdx` — props tables, variants tables, usage narrative, examples
- `buttons/page.mdx` — button variants, defaults, examples
- `actions/page.mdx` — button examples in action demos
- `effects/page.mdx` — component usage in examples
- `constraints/page.mdx` — char limits and validation rules

**Learn docs** (`apps/docs/src/app/(docs)/(learn)/`):

- `examples/page.mdx` — full snap response examples
- `building/page.mdx` — code example

**LLM / agent docs**:

- `apps/docs/public/SKILL.md` — agent skill with design guidance
- `AGENTS.md` — protocol references
- `template/AGENTS.md` — protocol references

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
- Component count strings (e.g. "16 components") appear in multiple places — grep for
  the old count when adding or removing components
- The OG renderer (`og-image.ts`) has its own element mapping separate from the HTML
  renderer — both must be updated when components change
