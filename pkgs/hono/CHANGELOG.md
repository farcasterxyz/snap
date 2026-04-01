# @farcaster/snap-hono

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
