# @farcaster/snap-upstash

## 1.0.0

### Major Changes

- [#31](https://github.com/farcasterxyz/snap/pull/31) [`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add a key-value data store to snaps.

  `SnapContext` now includes a required `data: SnapDataStore` field with `get(key)` and `set(key, value)` methods and a `withLock(fn)` method for concurrency-safe reads and writes. `@farcaster/snap` exports the `SnapDataStore`, `SnapDataStoreOperations`, and `DataStoreValue` types, plus `createDefaultDataStore()` which returns a stub that throws on use.

  The new `@farcaster/snap-upstash` package provides `withUpstash(snapFn)`, a `SnapFunction` wrapper that injects an Upstash Redis-backed store when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. `withLock` uses `@upstash/lock` with a configurable timeout to serialize concurrent access.

### Patch Changes

- Updated dependencies [[`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00)]:
  - @farcaster/snap@1.5.0
