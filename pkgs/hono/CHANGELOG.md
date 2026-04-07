# @farcaster/snap-hono

## 1.4.5

### Patch Changes

- Updated dependencies [[`93973e2`](https://github.com/farcasterxyz/snap/commit/93973e23768cd3746e1a8719b1b9e8e85f913517)]:
  - @farcaster/snap@1.14.0

## 1.4.4

### Patch Changes

- Updated dependencies [[`9bbebf9`](https://github.com/farcasterxyz/snap/commit/9bbebf937b6540fbb94c77fd95151f1c8e09f087)]:
  - @farcaster/snap@1.13.0

## 1.4.3

### Patch Changes

- [`5be48bf`](https://github.com/farcasterxyz/snap/commit/5be48bfe1f517bb1b725a616bdf0b541cbab5e74) Thanks [@lyoshenka](https://github.com/lyoshenka)! - moved data storage out of snap package and strictly into snap-turso

- Updated dependencies [[`5be48bf`](https://github.com/farcasterxyz/snap/commit/5be48bfe1f517bb1b725a616bdf0b541cbab5e74)]:
  - @farcaster/snap@1.10.0

## 1.4.2

### Patch Changes

- Updated dependencies [[`ecab10f`](https://github.com/farcasterxyz/snap/commit/ecab10f058da2cb270b542ef3ad4a596b1696b7e)]:
  - @farcaster/snap@1.8.0

## 1.4.1

### Patch Changes

- Updated dependencies [[`47bb9cb`](https://github.com/farcasterxyz/snap/commit/47bb9cb97b56c8b434a5e4787ef27bd89267513e)]:
  - @farcaster/snap@1.7.1

## 1.4.0

### Minor Changes

- [`644763c`](https://github.com/farcasterxyz/snap/commit/644763ca68ef93e0682b75f8476d9671a4f7c125) Thanks [@lyoshenka](https://github.com/lyoshenka)! - switch to json-render

### Patch Changes

- Updated dependencies [[`644763c`](https://github.com/farcasterxyz/snap/commit/644763ca68ef93e0682b75f8476d9671a4f7c125)]:
  - @farcaster/snap@1.6.0

## 1.3.2

### Patch Changes

- Updated dependencies [[`7bc09f8`](https://github.com/farcasterxyz/snap/commit/7bc09f884ce6d8c1eb3c7e7163a184ef4618f363)]:
  - @farcaster/snap@1.5.2

## 1.3.1

### Patch Changes

- Updated dependencies [[`740ad60`](https://github.com/farcasterxyz/snap/commit/740ad605a9909688f39ab717df322ba65ed5fb59)]:
  - @farcaster/snap@1.5.1

## 1.3.0

### Minor Changes

- [#31](https://github.com/farcasterxyz/snap/pull/31) [`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add a key-value data store to snaps.

  `SnapContext` now includes a required `data: SnapDataStore` field with `get(key)` and `set(key, value)` methods and a `withLock(fn)` method for concurrency-safe reads and writes. `@farcaster/snap` exports the `SnapDataStore`, `SnapDataStoreOperations`, and `DataStoreValue` types, plus `createDefaultDataStore()` which returns a stub that throws on use.

  The new `@farcaster/snap-upstash` package provides `withUpstash(snapFn)`, a `SnapFunction` wrapper that injects an Upstash Redis-backed store when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. `withLock` uses `@upstash/lock` with a configurable timeout to serialize concurrent access.

### Patch Changes

- Updated dependencies [[`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00)]:
  - @farcaster/snap@1.5.0

## 1.2.1

### Patch Changes

- [`f4af26f`](https://github.com/farcasterxyz/snap/commit/f4af26f22e818376d2a2e9cf4747e3ccb23df569) Thanks [@lyoshenka](https://github.com/lyoshenka)! - export more types, add og image generation

- Updated dependencies [[`f4af26f`](https://github.com/farcasterxyz/snap/commit/f4af26f22e818376d2a2e9cf4747e3ccb23df569)]:
  - @farcaster/snap@1.4.1

## 1.2.0

### Minor Changes

- [`9171ca2`](https://github.com/farcasterxyz/snap/commit/9171ca2cb6888019ca407d25183d871122897ba3) Thanks [@lyoshenka](https://github.com/lyoshenka)! - fix inconsistencies, rename some params and exports

### Patch Changes

- Updated dependencies [[`9171ca2`](https://github.com/farcasterxyz/snap/commit/9171ca2cb6888019ca407d25183d871122897ba3)]:
  - @farcaster/snap@1.4.0

## 1.1.8

### Patch Changes

- [#25](https://github.com/farcasterxyz/snap/pull/25) [`2472b30`](https://github.com/farcasterxyz/snap/commit/2472b30a678859f47b49a36f6c1a7d780512e10a) Thanks [@rishavmukherji](https://github.com/rishavmukherji)! - fix: make button_layout and theme optional in SnapFunction return type

  SnapFunction now accepts SnapResponseInput (Zod input type) instead of SnapResponse (Zod output type), so fields with schema defaults like button_layout and theme.accent are optional in handler return values.

- Updated dependencies [[`2472b30`](https://github.com/farcasterxyz/snap/commit/2472b30a678859f47b49a36f6c1a7d780512e10a)]:
  - @farcaster/snap@1.3.3

## 1.1.7

### Patch Changes

- Updated dependencies [[`c26ef28`](https://github.com/farcasterxyz/snap/commit/c26ef28266c4b18f6939413aecacb1088ae7e224)]:
  - @farcaster/snap@1.3.2

## 1.1.6

### Patch Changes

- [`b85eb51`](https://github.com/farcasterxyz/snap/commit/b85eb511b22b8aacbbf6f47d45155d134f585494) Thanks [@lyoshenka](https://github.com/lyoshenka)! - drop video elements from spec (not really a patch change, i know)

- Updated dependencies [[`b85eb51`](https://github.com/farcasterxyz/snap/commit/b85eb511b22b8aacbbf6f47d45155d134f585494)]:
  - @farcaster/snap@1.3.1

## 1.1.5

### Patch Changes

- Updated dependencies [[`6e82952`](https://github.com/farcasterxyz/snap/commit/6e82952a6e1074d99d887ef06955bd884250bb3c)]:
  - @farcaster/snap@1.3.0

## 1.1.4

### Patch Changes

- Updated dependencies [[`d32b8a8`](https://github.com/farcasterxyz/snap/commit/d32b8a82e406c7ad7ceaafb66cb372865c6c3052)]:
  - @farcaster/snap@1.2.2

## 1.1.3

### Patch Changes

- Updated dependencies [[`f7a394d`](https://github.com/farcasterxyz/snap/commit/f7a394dd7dcf11393b5f332f1ae35267ce4ed21e)]:
  - @farcaster/snap@1.2.1

## 1.1.2

### Patch Changes

- [`94a09ac`](https://github.com/farcasterxyz/snap/commit/94a09ac79803ae090f9ae64bc142d17f5dd5768f) Thanks [@lyoshenka](https://github.com/lyoshenka)! - remove hub-nodejs dep so we can deploy to vercel

## 1.1.1

### Patch Changes

- [`f33d19b`](https://github.com/farcasterxyz/snap/commit/f33d19b8d260ff039888fea257b6c5c60968cbe6) Thanks [@lyoshenka](https://github.com/lyoshenka)! - fix hono missing.js extension

## 1.1.0

### Minor Changes

- [`b81112e`](https://github.com/farcasterxyz/snap/commit/b81112efeb0e30a04a0b988ba214524b48990992) Thanks [@lyoshenka](https://github.com/lyoshenka)! - change content-type header to be more standard, move node-dependent packages into separate export

### Patch Changes

- Updated dependencies [[`b81112e`](https://github.com/farcasterxyz/snap/commit/b81112efeb0e30a04a0b988ba214524b48990992)]:
  - @farcaster/snap@1.2.0

## 1.0.2

### Patch Changes

- Updated dependencies [[`43efc94`](https://github.com/farcasterxyz/snap/commit/43efc94445294975662431cb3db329437dc20de1)]:
  - @farcaster/snap@1.1.1

## 1.0.1

### Patch Changes

- Updated dependencies [[`cf8ab58`](https://github.com/farcasterxyz/snap/commit/cf8ab58b0a64bcf249ab9b738750733b45dfbd82)]:
  - @farcaster/snap@1.1.0
