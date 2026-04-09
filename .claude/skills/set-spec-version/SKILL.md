---
name: set-spec-version
description: Flip the snap spec default version. Updates all files that reference the current version — constants, docs config, SKILL.md files, template, and llms.txt.
---

## Overview

This skill upgrades (or downgrades) the snap spec default version across the entire repo.
Use it when the protocol is ready to promote a new version as the default.

## Input

The target version string, e.g. `"2.0"`. Must be one of the values in
`SUPPORTED_SPEC_VERSIONS` in `pkgs/snap/src/constants.ts`.

## Step 1: Update the source of truth

1. In `pkgs/snap/src/constants.ts`, change `SPEC_VERSION` to point to the target version
   constant (e.g. `SPEC_VERSION = SPEC_VERSION_2`).

2. In `apps/docs/src/lib/version-config.ts`, change `DEFAULT_VERSION` to the target
   version string.

## Step 2: Copy the versioned SKILL.md to root

Copy `apps/docs/public/{version}/SKILL.md` to `apps/docs/public/SKILL.md`.

This ensures agents reading the root SKILL.md get the correct version's instructions.

## Step 3: Update the template

In `template/src/index.ts`, change the `version` field in the snap response to match the
new default version string.

## Step 4: Update AGENTS.md files

Check `AGENTS.md` and `template/AGENTS.md` for any version references and update them.

## Step 5: Run sync-protocol-docs

After changing the version, run the `sync-protocol-docs` skill to ensure all downstream
files (docs pages, llms.txt, examples, renderers) are consistent with the new default.

## Step 6: Verify

1. Run `pnpm --filter @farcaster/snap build` — must pass.
2. Run `pnpm --filter @farcaster/snap test` — must pass.
3. Grep for the old default version string in docs and SKILL files to catch any stragglers.

## Checklist

- [ ] `pkgs/snap/src/constants.ts` — `SPEC_VERSION` updated
- [ ] `apps/docs/src/lib/version-config.ts` — `DEFAULT_VERSION` updated
- [ ] `apps/docs/public/SKILL.md` — copied from versioned SKILL
- [ ] `template/src/index.ts` — version field updated
- [ ] `AGENTS.md` / `template/AGENTS.md` — version refs updated
- [ ] `sync-protocol-docs` skill executed
- [ ] Build passes
- [ ] Tests pass
