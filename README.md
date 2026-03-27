# Farcaster Snaps 🫰

Spec and tooling for interactive snaps on [Farcaster](https://farcaster.xyz).

## 🚀 Quickstart

Agent command/skill docs live in [agent-skills/README.md](./agent-skills/README.md).

## 📖 Docs for Humans

See [snap.farcaster.xyz](https://snap.farcaster.xyz) for more info.

## Packages

### @farcaster/snap

Core library for Snap servers: Zod schemas and types for snap JSON, validation of pages and POST bodies, HTTP helpers (`parseRequest`, `sendResponse`), and JFS verification for signed POST requests (`verifyJFSRequestBody`).

The human-readable spec lives under [docs/](./docs); see [docs/README.md](./docs/README.md) for how it relates to the code.

### @farcaster/snap-emulator

A local snap emulator where you paste a snap URL and interact with it.

This emulator does **not** sign its payload with real private keys, so emulated snaps must bypass signature verification in order to work.

An emulator with full signing is available inside the Farcaster web app.

```bash
pnpm --filter @farcaster/snap-emulator dev
# Opens at `http://localhost:3000`.
```

### @farcaster/snap-hono

Convenience methods for running a Snap server using [Hono](https://hono.dev)

### @farcaster/snap-ui-elements

Shared catalog of UI element types and schemas that Snap JSON may reference. Built on [json-render](https://json-render.dev/).

## 🛠️ Development

This repo uses [pnpm](https://pnpm.io/) workspaces. Install dependencies once from the root:

```bash
pnpm install
```

(Use a recent Node; `corepack enable` then `corepack prepare pnpm@9.15.4 --activate` if you need to pin the same pnpm as [package.json](./package.json).)
