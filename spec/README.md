# Spec and Validation

This directory contains the Farcaster Snap specification. Runtime validation lives in the [`@farcaster/snap`](https://github.com/farcasterxyz/snap/tree/main/pkgs/snap) package (`pkgs/snap`); Hono-oriented HTTP wiring (`registerSnapHandler`) is in [`@farcaster/snap-hono`](https://github.com/farcasterxyz/snap/tree/main/pkgs/hono).

## Specification

- `SPEC.md` is the source of truth for snap schema, element types, and constraints.

## Validator (`@farcaster/snap`)

The `@farcaster/snap` package validates snap JSON against `SPEC.md` and related constraints.

```bash
# Run tests
pnpm --filter @farcaster/snap test
```

## Auth

See `auth.md` for request signing and hub verification. Implementation code is exported from `@farcaster/snap/server` (for example `verifyJFSRequestBody`, `parseRequest`); the main `@farcaster/snap` entry stays free of `@farcaster/hub-nodejs` for browser-safe imports.
