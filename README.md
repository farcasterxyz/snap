# Farcaster Snaps 🫰

Spec and tooling for interactive snaps on [Farcaster](https://farcaster.xyz).

## 🚀 Quickstart

Agent command/skill docs live in [agent-skills/README.md](./agent-skills/README.md).

## 📖 Docs for Humans

See [snap.farcaster.xyz](https://snap.farcaster.xyz) for more info.

## Packages

### @farcaster/snap

Core library for Snap servers: Zod schemas and types for snap JSON, validation of pages and POST bodies, and JFS verification for signed POST requests (`verifyJFSRequestBody`).

The human-readable spec lives under [docs/](./docs); see [docs/README.md](./docs/README.md) for how it relates to the code.

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

### @farcaster/snap-ui-elements

Shared catalog of UI element types and schemas that Snap JSON may reference. Built on [json-render](https://json-render.dev/).

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
