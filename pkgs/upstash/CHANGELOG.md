# @farcaster/snap-upstash

## 1.0.4

### Patch Changes

- [`b10ada0`](https://github.com/farcasterxyz/snap/commit/b10ada02dd85ce71ce4aebe2f6ac3b682c8f61a1) Thanks [@lyoshenka](https://github.com/lyoshenka)! - needs bumpin

## 1.0.3

### Patch Changes

- Updated dependencies [[`644763c`](https://github.com/farcasterxyz/snap/commit/644763ca68ef93e0682b75f8476d9671a4f7c125)]:
  - @farcaster/snap@1.6.0

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
