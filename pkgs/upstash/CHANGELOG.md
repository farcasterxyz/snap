# @farcaster/snap-upstash

## 1.0.2

### Patch Changes

- Updated dependencies [[`7bc09f8`](https://github.com/farcasterxyz/snap/commit/7bc09f884ce6d8c1eb3c7e7163a184ef4618f363)]:
  - @farcaster/snap@1.5.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`740ad60`](https://github.com/farcasterxyz/snap/commit/740ad605a9909688f39ab717df322ba65ed5fb59)]:
  - @farcaster/snap@1.5.1

## 1.0.0

### Major Changes

- [#31](https://github.com/farcasterxyz/snap/pull/31) [`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add a key-value data store to snaps.

  `SnapContext` now includes a required `data: SnapDataStore` field with `get(key)` and `set(key, value)` methods and a `withLock(fn)` method for concurrency-safe reads and writes. `@farcaster/snap` exports the `SnapDataStore`, `SnapDataStoreOperations`, and `DataStoreValue` types, plus `createDefaultDataStore()` which returns a stub that throws on use.

  The new `@farcaster/snap-upstash` package provides `withUpstash(snapFn)`, a `SnapFunction` wrapper that injects an Upstash Redis-backed store when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. `withLock` uses `@upstash/lock` with a configurable timeout to serialize concurrent access.

### Patch Changes

- Updated dependencies [[`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00)]:
  - @farcaster/snap@1.5.0
