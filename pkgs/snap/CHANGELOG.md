# @farcaster/snap

## 1.3.3

### Patch Changes

- [#25](https://github.com/farcasterxyz/snap/pull/25) [`2472b30`](https://github.com/farcasterxyz/snap/commit/2472b30a678859f47b49a36f6c1a7d780512e10a) Thanks [@rishavmukherji](https://github.com/rishavmukherji)! - fix: make button_layout and theme optional in SnapFunction return type

  SnapFunction now accepts SnapResponseInput (Zod input type) instead of SnapResponse (Zod output type), so fields with schema defaults like button_layout and theme.accent are optional in handler return values.

## 1.3.2

### Patch Changes

- [#20](https://github.com/farcasterxyz/snap/pull/20) [`c26ef28`](https://github.com/farcasterxyz/snap/commit/c26ef28266c4b18f6939413aecacb1088ae7e224) Thanks [@lyoshenka](https://github.com/lyoshenka)! - added ui catalog

## 1.3.1

### Patch Changes

- [`b85eb51`](https://github.com/farcasterxyz/snap/commit/b85eb511b22b8aacbbf6f47d45155d134f585494) Thanks [@lyoshenka](https://github.com/lyoshenka)! - drop video elements from spec (not really a patch change, i know)

## 1.3.0

### Minor Changes

- [`6e82952`](https://github.com/farcasterxyz/snap/commit/6e82952a6e1074d99d887ef06955bd884250bb3c) Thanks [@lyoshenka](https://github.com/lyoshenka)! - make snap work with zod v3 or v4

## 1.2.2

### Patch Changes

- [`d32b8a8`](https://github.com/farcasterxyz/snap/commit/d32b8a82e406c7ad7ceaafb66cb372865c6c3052) Thanks [@lyoshenka](https://github.com/lyoshenka)! - allegedly fix ESM error for real

## 1.2.1

### Patch Changes

- [`f7a394d`](https://github.com/farcasterxyz/snap/commit/f7a394dd7dcf11393b5f332f1ae35267ce4ed21e) Thanks [@lyoshenka](https://github.com/lyoshenka)! - fix ESM loading bug

## 1.2.0

### Minor Changes

- [`b81112e`](https://github.com/farcasterxyz/snap/commit/b81112efeb0e30a04a0b988ba214524b48990992) Thanks [@lyoshenka](https://github.com/lyoshenka)! - change content-type header to be more standard, move node-dependent packages into separate export

## 1.1.1

### Patch Changes

- [`43efc94`](https://github.com/farcasterxyz/snap/commit/43efc94445294975662431cb3db329437dc20de1) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Internal deployment validation; no user-facing changes.

## 1.1.0

### Minor Changes

- [`cf8ab58`](https://github.com/farcasterxyz/snap/commit/cf8ab58b0a64bcf249ab9b738750733b45dfbd82) Thanks [@lyoshenka](https://github.com/lyoshenka)! - first publish
