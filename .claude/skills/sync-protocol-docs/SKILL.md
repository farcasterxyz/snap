---
name: sync-protocol-docs
description: Audit and fix all documentation, components, and examples to match the snap protocol schema definitions. Run after any change to component schemas in pkgs/snap/src/ui/.
---

## Overview

This skill ensures every file that references snap protocol values (component props,
variants, sizes, aspect ratios, etc.) stays in sync with the canonical schema definitions
in `pkgs/snap/src/ui/`.

## Step 1: Read the schema source of truth

Read every `.ts` file in `pkgs/snap/src/ui/` and `pkgs/snap/src/colors.ts`. Extract the
current valid values for each component: variants, sizes, weights, aspect ratios, icon
names, gap values, orientations, char limits, and default values.

## Step 2: Audit all downstream files

For each schema constant, grep the repo for any value that was removed or renamed. Check
these file groups:

**React components** (`pkgs/snap/src/react/components/`):

- Variant/size/weight maps must only contain current schema values
- Default fallbacks must match schema defaults

**React Native components** (`pkgs/snap/src/react-native/components/`):

- Same as React components

**Server-side renderer** (`pkgs/hono/src/renderSnapPage.ts`):

- Switch cases and style maps must match schema values

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

- `apps/docs/src/app/SKILL.md/SKILL.md` — design guidance
- `AGENTS.md` — protocol references
- `template/AGENTS.md` — protocol references

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
