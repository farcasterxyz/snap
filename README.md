# Farcaster Snaps 🫰

Snaps are lightweight interactive apps right in your [Farcaster](https://farcaster.xyz) feed.

This is the monorepo for the core packages, docs site, emulator, template, and examples.

> [!NOTE]
> This spec is in beta and may change rapidly in the near term.

## 🚀 Quickstart

Tell your agent

```
Read https://docs.farcaster.xyz/snap/SKILL.md and make a snap that ...
```

## 📖 Docs for Humans

See [docs.farcaster.xyz/snap](https://docs.farcaster.xyz/snap) for more info.

## Packages

### @farcaster/snap

Core library for Snap servers: Zod schemas and types for snap JSON, validation of pages and POST bodies, and JFS verification for signed POST requests (`verifyJFSRequestBody`).

The human-readable spec is authored as MDX under `apps/docs/src/app/(docs)/` and published at [docs.farcaster.xyz/snap](https://docs.farcaster.xyz/snap). Runtime validation remains in `@farcaster/snap` (`pkgs/snap`).

### @farcaster/snap-emulator

A local snap emulator where you paste a snap URL and interact with it.

This emulator does **not** sign its payload with real private keys, so emulated snaps must bypass signature verification in order to work.

An emulator with JFS signing is available inside the Farcaster web app.

```bash
pnpm --filter @farcaster/snap-emulator dev
# Opens at `http://localhost:3000`.
```

The emulator lives under [`apps/emulator`](./apps/emulator). Hono examples are under [`examples/`](./examples/README.md); the deployable starter is [`template/`](./template/README.md).

### @farcaster/snap-hono

Convenience methods for running a Snap server using [Hono](https://hono.dev)

### @farcaster/snap/ui

The json-render catalog for snaps is exported from `@farcaster/snap/ui` and per-component sub-paths (e.g., `@farcaster/snap/ui/button`). Built on [json-render](https://json-render.dev/).

## 🛠️ Development

This repo uses [pnpm](https://pnpm.io/) workspaces and [Turborepo](https://turbo.build/). Install dependencies once from the root:

```bash
pnpm install
```

Common tasks:

```bash
pnpm build       # turbo build — all packages (snap + hono + emulator + examples)
pnpm test        # turbo test — Vitest in @farcaster/snap
pnpm typecheck   # turbo typecheck
```

(Use a recent Node; `corepack enable` then `corepack prepare pnpm@9.15.4 --activate` if you need to pin the same pnpm as [package.json](./package.json).)

`turbo dev` builds workspace dependencies first (`^build`). Example: `pnpm exec turbo dev --filter=@farcaster/snap-emulator`.

## Releases and Changesets

Published packages are versioned with [Changesets](https://github.com/changesets/changesets). Each package keeps its own semver; internal workspace references are bumped as patch when needed.

**When you change something consumers should know about**, add a changeset in your PR (not on every commit):

```bash
pnpm exec changeset
```

Pick the affected package(s) and the bump level (major / minor / patch). That writes a file under [`.changeset/`](./.changeset/); commit it with your code.

**On push to `main`**, the [Changesets workflow](.github/workflows/changesets.yml) runs (alongside the same [verify](.github/workflows/verify.yml) jobs as on pull requests). The [changesets/action](https://github.com/changesets/action) step either:

- Opens or updates a **Version packages** PR (`pnpm changeset:version` — bumps versions, updates changelogs from your changeset files, refreshes the lockfile, runs `pnpm typecheck`), or
- If that PR was merged and there is nothing left to version, runs **`pnpm changeset:publish`** — builds `pkgs/*` and publishes to npm.

Changelogs use [@changesets/changelog-github](https://github.com/changesets/changelog-github) against this repo. GitHub Releases are created for published versions on `main`.

**CI secrets** (org/repo): `NPM_TOKEN`, and `REPO_SCOPED_TOKEN` for the Changesets GitHub app token (same pattern as other Farcaster repos such as [miniapps](https://github.com/farcasterxyz/miniapps)).

# Farcaster Snaps

Spec and tooling for building interactive Farcaster Snaps. This is the monorepo for the core packages, docs site, emulator, template, and examples.

> **Beta:** The spec is in beta and may change in the near term.

## Public docs

Human and agent starting point: **[docs.farcaster.xyz/snap](https://docs.farcaster.xyz/snap)**

The docs site is the canonical prose documentation. It covers the protocol overview, all element and button types, constraints, authentication, and integration patterns.

## Repo map

```
pkgs/
  snap/        @farcaster/snap       — Zod schemas, validation, JFS verification
  hono/        @farcaster/snap-hono  — Hono registerSnapHandler integration
  turso/       @farcaster/snap-turso — data store helpers (Turso + in-memory)
apps/
  docs/                              — Next.js docs site (docs.farcaster.xyz/snap)
  emulator/    @farcaster/snap-emulator — Local snap emulator (port 3000)
template/                            — Deployable Hono starter (port 3003)
examples/                            — Runnable example snap servers
agent-skills/                        — Agent workflow skill files
spec/                                — Pointer stubs; canonical spec lives in apps/docs
```

The canonical machine definition of the protocol is `pkgs/snap/src/schemas.ts`. The docs site explains those schemas in prose.

## Development

This repo uses [pnpm](https://pnpm.io/) workspaces and [Turborepo](https://turbo.build/).

```bash
pnpm install
pnpm build       # turbo build — all packages
pnpm test        # turbo test — Vitest in @farcaster/snap
pnpm typecheck   # turbo typecheck
```

Run the docs site locally:

```bash
pnpm exec turbo dev --filter=@farcaster/snap-docs
# Opens at http://localhost:3001
```

Run the emulator:

```bash
pnpm exec turbo dev --filter=@farcaster/snap-emulator
# Opens at http://localhost:3000
```

Run the template snap:

```bash
cd template && pnpm install && pnpm dev
# Opens at http://localhost:3003
```

See [`WORKSPACE.md`](./WORKSPACE.md) for port reference, env vars, and other operational details.

## Packages

### `@farcaster/snap`

Core library: Zod schemas and types for snap JSON, runtime validation of pages and POST bodies, and JFS verification (`verifyJFSRequestBody`). Safe for browser bundles — the main entry has no Node.js dependencies.

### `@farcaster/snap-hono`

Hono integration: `registerSnapHandler` wires GET and POST routes, validates responses, and handles JFS verification.

### `@farcaster/snap-turso`

Optional data storage via Neynar hosting.

### `@farcaster/snap/ui`

json-render catalog for snap elements. Exported from `@farcaster/snap/ui` and per-component sub-paths (e.g., `@farcaster/snap/ui/button`).

## Releases

Published packages are versioned with [Changesets](https://github.com/changesets/changesets). To add a changeset for a consumer-facing change:

```bash
pnpm exec changeset
```

Pick the affected packages and bump level. Commit the resulting file under `.changeset/`. On push to `main`, the Changesets workflow either opens a "Version packages" PR or publishes to npm if the PR was already merged.

**Never create or edit `.changeset/*.md` files manually.**

## Agents working in this repo

Read [`AGENTS.md`](./AGENTS.md) for design principles, philosophy, and coding conventions. Read [`WORKSPACE.md`](./WORKSPACE.md) for operational details (ports, env vars, build quirks).

The create-snap agent skill lives at the docs app and is also served from [docs.farcaster.xyz/snap/SKILL.md](https://docs.farcaster.xyz/snap/SKILL.md).
