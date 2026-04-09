# @farcaster/snap

## 1.16.1

### Patch Changes

- [#99](https://github.com/farcasterxyz/snap/pull/99) [`4cf9210`](https://github.com/farcasterxyz/snap/commit/4cf921010deb9be803966f8c99c9c1091ab3c1a2) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Make nonce and audience optional in POST payload schema for backward compatibility with existing clients. When present, audience is validated against the server origin.

## 1.16.0

### Minor Changes

- [#95](https://github.com/farcasterxyz/snap/pull/95) [`145297b`](https://github.com/farcasterxyz/snap/commit/145297b8d9dcb06182a8292a830aa5c9c33b24a5) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add snap spec v2.0 support with structural validation, audience/nonce auth, and versioned rendering.
  - New version constants: `SPEC_VERSION_1`, `SPEC_VERSION_2`, `SPEC_VERSION`
  - Structural validation for v2 snaps: element count (64), root children (7), children per container (6), nesting depth (4)
  - URL validation: HTTPS enforcement for action targets and image URLs
  - `SnapCard` component now version-switches between v1 and v2 renderers with validation
  - Removed unused `SnapView` export — use `SnapCard` instead
  - `parseRequest` now validates audience origin for v2 snaps
  - Versioned docs system with v1.0 and v2.0 content

### Patch Changes

- [#95](https://github.com/farcasterxyz/snap/pull/95) [`145297b`](https://github.com/farcasterxyz/snap/commit/145297b8d9dcb06182a8292a830aa5c9c33b24a5) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Update badge styling to use tinted translucent backgrounds instead of solid color backgrounds. Default (filled) badges now show colored text on a light tinted background, matching the docs preview style. Applies to both React web and React Native renderers.

## 1.15.4

### Patch Changes

- [`70bbbc1`](https://github.com/farcasterxyz/snap/commit/70bbbc173b7ab532cd1e73522dd7b1d41ace1704) Thanks [@lyoshenka](https://github.com/lyoshenka)! - add isSnap param to open_url action for external link indication

## 1.15.3

### Patch Changes

- [`a43c623`](https://github.com/farcasterxyz/snap/commit/a43c6237d60dfc581b6402baaab201b8ec9508c4) Thanks [@lyoshenka](https://github.com/lyoshenka)! - minor confetti improvement

## 1.15.2

### Patch Changes

- [#90](https://github.com/farcasterxyz/snap/pull/90) [`4511666`](https://github.com/farcasterxyz/snap/commit/45116663b43adf0587d41152850e923ba38cde87) Thanks [@lyoshenka](https://github.com/lyoshenka)! - add React Native component for confetti

## 1.15.1

### Patch Changes

- [#81](https://github.com/farcasterxyz/snap/pull/81) [`9825b48`](https://github.com/farcasterxyz/snap/commit/9825b484410c759bbe6351d005c8ed8129daff0b) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Fix light mode colors by reading appearance from SnapView context instead of useColorMode.

## 1.15.0

### Minor Changes

- [#79](https://github.com/farcasterxyz/snap/pull/79) [`e9649fb`](https://github.com/farcasterxyz/snap/commit/e9649fb385d6d708a38d631d142967d36a60eb01) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Fix cell_grid rendering with rowHeight prop and improved loading overlay translucency.

## 1.14.0

### Minor Changes

- [#74](https://github.com/farcasterxyz/snap/pull/74) [`93973e2`](https://github.com/farcasterxyz/snap/commit/93973e23768cd3746e1a8719b1b9e8e85f913517) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Self-contained component styles via useSnapColors hook. All React and React Native components now use explicit inline colors independent of host app CSS themes.

## 1.13.0

### Minor Changes

- [`9bbebf9`](https://github.com/farcasterxyz/snap/commit/9bbebf937b6540fbb94c77fd95151f1c8e09f087) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add bar_chart and cell_grid components. Widen SnapHandlerResult type for dynamic element construction. Update HTML and OG renderers for v1 components.

## 1.10.0

### Minor Changes

- [`5be48bf`](https://github.com/farcasterxyz/snap/commit/5be48bfe1f517bb1b725a616bdf0b541cbab5e74) Thanks [@lyoshenka](https://github.com/lyoshenka)! - moved data storage out of snap package and strictly into snap-turso

## 1.8.0

### Minor Changes

- [`ecab10f`](https://github.com/farcasterxyz/snap/commit/ecab10f058da2cb270b542ef3ad4a596b1696b7e) Thanks [@lyoshenka](https://github.com/lyoshenka)! - actual version bumps for turso release

## 1.7.1

### Patch Changes

- [`47bb9cb`](https://github.com/farcasterxyz/snap/commit/47bb9cb97b56c8b434a5e4787ef27bd89267513e) Thanks [@lyoshenka](https://github.com/lyoshenka)! - testing publish

## 1.6.0

### Minor Changes

- [`644763c`](https://github.com/farcasterxyz/snap/commit/644763ca68ef93e0682b75f8476d9671a4f7c125) Thanks [@lyoshenka](https://github.com/lyoshenka)! - switch to json-render

## 1.5.2

### Patch Changes

- [`7bc09f8`](https://github.com/farcasterxyz/snap/commit/7bc09f884ce6d8c1eb3c7e7163a184ef4618f363) Thanks [@lyoshenka](https://github.com/lyoshenka)! - add middleware

## 1.5.1

### Patch Changes

- [`740ad60`](https://github.com/farcasterxyz/snap/commit/740ad605a9909688f39ab717df322ba65ed5fb59) Thanks [@lyoshenka](https://github.com/lyoshenka)! - add sdk actions

## 1.5.0

### Minor Changes

- [#31](https://github.com/farcasterxyz/snap/pull/31) [`55eab71`](https://github.com/farcasterxyz/snap/commit/55eab711f32cc61eb41ba583ec248f7c50392f00) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add a key-value data store to snaps.

  `SnapContext` now includes a required `data: SnapDataStore` field with `get(key)` and `set(key, value)` methods and a `withLock(fn)` method for concurrency-safe reads and writes. `@farcaster/snap` exports the `SnapDataStore`, `SnapDataStoreOperations`, and `DataStoreValue` types, plus `createDefaultDataStore()` which returns a stub that throws on use.

  The new `@farcaster/snap-upstash` package provides `withUpstash(snapFn)`, a `SnapFunction` wrapper that injects an Upstash Redis-backed store when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. `withLock` uses `@upstash/lock` with a configurable timeout to serialize concurrent access.

## 1.4.1

### Patch Changes

- [`f4af26f`](https://github.com/farcasterxyz/snap/commit/f4af26f22e818376d2a2e9cf4747e3ccb23df569) Thanks [@lyoshenka](https://github.com/lyoshenka)! - export more types, add og image generation

## 1.4.0

### Minor Changes

- [`9171ca2`](https://github.com/farcasterxyz/snap/commit/9171ca2cb6888019ca407d25183d871122897ba3) Thanks [@lyoshenka](https://github.com/lyoshenka)! - fix inconsistencies, rename some params and exports

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
