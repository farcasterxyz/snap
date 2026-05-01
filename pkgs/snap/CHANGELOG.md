# @farcaster/snap

## 2.3.0

### Minor Changes

- [#167](https://github.com/farcasterxyz/snap/pull/167) [`e2e45a1`](https://github.com/farcasterxyz/snap/commit/e2e45a152df97194072e25094fc44042e1082b0a) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add optional `value` field to `cell_grid` cells. When set, the cell's `value` (string, 1–30 chars) is what's written to `inputs[name]` on press or selection. When omitted, the existing `"row,col"` fallback applies. This removes a recurring foot-gun for grids with meaningful labels (calendar days, alphabet letters, region codes) where action handlers previously had to reverse-lookup row/col into the cell's label.

- [#168](https://github.com/farcasterxyz/snap/pull/168) [`7bd3591`](https://github.com/farcasterxyz/snap/commit/7bd3591c7fb4ed17f5d2aca7b8fbb058cf1ec757) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Tighten horizontal stack gap scale and add column-aware defaults. Horizontal `gap` now resolves to `none/sm/md/lg = 0/4/8/16 px` (down from `0/4/8/12`; `lg` grows by 4px, `sm`/`md` grow lighter). When `gap` is omitted on a horizontal stack, the default is chosen by column count: 2 cols → `lg` (16px), 3 cols → `md` (8px), 4+ cols → `sm` (4px), unknown → `md`. Column count comes from `columns` when set, or is inferred from button-row children, or falls back to direct child count for any horizontal stack. Vertical stacks are unchanged. An explicit `gap` always wins.

### Patch Changes

- [#168](https://github.com/farcasterxyz/snap/pull/168) [`3f25a68`](https://github.com/farcasterxyz/snap/commit/3f25a68acf08132891a6d4e72bd66c0265b5fe35) Thanks [@bob-obringer](https://github.com/bob-obringer)! - fix(snap): web `text` no longer fills column height inside a vertical stack. The component used `flex-1` to fill horizontal width, which silently set `flex-grow: 1` along the parent's main axis — so when a vertical stack was a peer of a tall element (e.g. a `9:16` image), text children stretched to evenly fill the column instead of stacking at the top with their gap. Switched the vertical-stack class to `min-w-0` only (block elements already fill width via their parent's `w-full`). Native is unaffected since RN text uses explicit `width: "100%"` rather than flex-grow.

## 2.2.0

### Minor Changes

- [#164](https://github.com/farcasterxyz/snap/pull/164) [`f88e99f`](https://github.com/farcasterxyz/snap/commit/f88e99fa2bbdb2261d88b4f741c9f27aafae3e9b) Thanks [@lyoshenka](https://github.com/lyoshenka)! - allow GET requests to include a signed snap payload

### Patch Changes

- [`d59ebe2`](https://github.com/farcasterxyz/snap/commit/d59ebe22e0c2e05dd05915692250024c3e7eafce) Thanks [@lyoshenka](https://github.com/lyoshenka)! - fix accent color overriding custom color on grid cells

## 2.1.2

### Patch Changes

- [#162](https://github.com/farcasterxyz/snap/pull/162) [`3b62b7e`](https://github.com/farcasterxyz/snap/commit/3b62b7e7342507bac224a849d93bb7551519375f) Thanks [@bob-obringer](https://github.com/bob-obringer)! - fix(snap): web SnapText rows hug content like native

  Horizontal stack children no longer apply flex-1 to web text; paired labels stay grouped on the left with gap, matching React Native behavior.

## 2.1.1

### Patch Changes

- [#160](https://github.com/farcasterxyz/snap/pull/160) [`25900c8`](https://github.com/farcasterxyz/snap/commit/25900c8ac49d6ca1008d9df1029864e7c4b9f613) Thanks [@bob-obringer](https://github.com/bob-obringer)! - fix(snap): absorb `<SnapCard />` "Show more" pill overhang internally

  The v2 Show more/less pill is positioned `bottom: -14`, straddling the card's bottom border. Any consumer wrapping `<SnapCard />` in a clipping (`overflow: hidden`) rounded container was losing the pill's bottom half — a bug shipped in Farcaster's mobile client.

  The component now reserves that 14px of space itself (conditional on the pill actually rendering), in both the React Native and web builds. Short non-overflowing snaps get zero extra space. `plain` and `showOverflowWarning` modes are unchanged.

  Migration: if you added your own `paddingBottom: 14` wrapper around `<SnapCard />` to work around this bug, drop it when upgrading — otherwise you'll have doubled overhang.

## 2.1.0

### Minor Changes

- [#159](https://github.com/farcasterxyz/snap/pull/159) [`bfbf8e7`](https://github.com/farcasterxyz/snap/commit/bfbf8e7a38379d5f036df4ebf4069820440cb767) Thanks [@bob-obringer](https://github.com/bob-obringer)! - feat(cell_grid): add `on.press` so a single press can fire an action (e.g. `submit`) without requiring a separate button. Two interaction modes, mutually exclusive: leave `select: "off"` (default) and bind `on.press` for press-to-act — `inputs[name]` is set to `"row,col"` before the action runs, so the POST body identifies the pressed cell; OR set `select: "single"` / `"multiple"` for press-to-select with a visual ring and pair with a separate submit `button`. `on.press` is ignored whenever `select` is on. Event name matches `button.on.press` for consistency.

### Patch Changes

- [#155](https://github.com/farcasterxyz/snap/pull/155) [`66f3b9c`](https://github.com/farcasterxyz/snap/commit/66f3b9c8370240eaf7324a21de2228ecfc50b4fd) Thanks [@bob-obringer](https://github.com/bob-obringer)! - fix(react-native): wire up `ConfettiOverlay` in `SnapViewCoreInner` so `snap.effects: ["confetti"]` actually renders on mobile. Keyed on a counter so repeat triggers restart the animation, matching web behavior.

- [#157](https://github.com/farcasterxyz/snap/pull/157) [`1661cbe`](https://github.com/farcasterxyz/snap/commit/1661cbe7154230d3eeb9134be1c56ecd23a8c5ca) Thanks [@bob-obringer](https://github.com/bob-obringer)! - docs(llms.txt): add ESM import rule to `llms.txt` — local relative imports in the snap template must include `.js` (e.g. `./foo.js`), otherwise deploys fail with `500 FUNCTION_INVOCATION_FAILED` (NEYN-10450).

## 2.0.3

### Patch Changes

- [`fab022c`](https://github.com/farcasterxyz/snap/commit/fab022ca80431036eae3220acce762270c243007) Thanks [@lyoshenka](https://github.com/lyoshenka)! - Add loadingOverlay prop to SnapView/SnapCard for replacing the built-in loading UI

## 2.0.2

### Patch Changes

- [`374badb`](https://github.com/farcasterxyz/snap/commit/374badb921725b21eedf02c2513a071974b1ef43) Thanks [@lyoshenka](https://github.com/lyoshenka)! - implement missing open_snap action

## 2.0.1

### Patch Changes

- [`f16ea0b`](https://github.com/farcasterxyz/snap/commit/f16ea0b7bbbe12a7e601d3625af8e8cf0cdb1bce) Thanks [@lyoshenka](https://github.com/lyoshenka)! - 2.0 was used and deprecated in the past. we need an new version

## 2.0.0

### Major Changes

- [#131](https://github.com/farcasterxyz/snap/pull/131) [`89796c1`](https://github.com/farcasterxyz/snap/commit/89796c13cbc5e64616b4a039de3d20fda9fe6997) Thanks [@lyoshenka](https://github.com/lyoshenka)! - This release upgrades `@farcaster/snap` to v2 and includes breaking changes to the POST payload schema.

  Consumers must update requests that were sending the v1 payload shape:
  - remove the previously required `nonce` field
  - add the `user` field
  - add the `surface` field
  - treat `user` and `surface` as required in v2
  - deprecate `fid` in favor of `user.fid`

  v1-style payloads are not forward-compatible with v2; callers should update request construction before upgrading.

  The easiest way to upgrade is to tell your agent `read https://docs.farcaster.xyz/snap/SKILL.md, then upgrade dependencies and the snap to the latest versions`

## 1.22.1

### Patch Changes

- [#127](https://github.com/farcasterxyz/snap/pull/127) [`2ed9dc9`](https://github.com/farcasterxyz/snap/commit/2ed9dc91ff8f94a35b8cedf0b847ac7b44efd886) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Update color palette to new light/dark mode values

## 1.22.0

### Minor Changes

- [#124](https://github.com/farcasterxyz/snap/pull/124) [`7b8476e`](https://github.com/farcasterxyz/snap/commit/7b8476e05031c79849ed78b7084e145abbcb2c07) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Set default spec version to v2.0, fix React Native cell_grid height rendering, and fix SnapCardV2 overflow warning visibility.

## 1.21.0

### Minor Changes

- [#120](https://github.com/farcasterxyz/snap/pull/120) [`5101555`](https://github.com/farcasterxyz/snap/commit/51015553c63491b3499912f81aa4790e0ccf12dd) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add `open_snap` action for opening snap URLs inline. Unlike `open_url` which opens an external browser, `open_snap` tells the client to render the target as a snap. Removes undocumented `isSnap` param from `open_url`. Buttons with `open_url` now always show the external link icon.

## 1.20.0

### Minor Changes

- [#118](https://github.com/farcasterxyz/snap/pull/118) [`968505d`](https://github.com/farcasterxyz/snap/commit/968505d417fe69cf2e22888b7cbaeeb3e1a9e15c) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add card frame styling to web SnapCard (border, border-radius, background, padding) matching the native implementation. Add `plain` prop to skip the card frame on both web and native. Remove undocumented `isSnap` param from `open_url` action. Convert theme text and border colors to rgba.

### Patch Changes

- [#118](https://github.com/farcasterxyz/snap/pull/118) [`968505d`](https://github.com/farcasterxyz/snap/commit/968505d417fe69cf2e22888b7cbaeeb3e1a9e15c) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add V1 show more/show less overflow handling on web and native while preserving V2 clipping and emulator overflow warnings.

## 1.19.0

### Minor Changes

- [#116](https://github.com/farcasterxyz/snap/pull/116) [`a9d42ad`](https://github.com/farcasterxyz/snap/commit/a9d42addd669409364f17a90c9a99e937c29bc0d) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add `showValue` prop to slider component for displaying the current value next to the label. Fix native item layout collapse (remove flex:1), fix native badge variant fallback, and tighten native component spacing.

## 1.18.0

### Minor Changes

- [#113](https://github.com/farcasterxyz/snap/pull/113) [`960973d`](https://github.com/farcasterxyz/snap/commit/960973d329022c7fdbfa9be66178fba18d42bb38) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Make `nonce` and `audience` required in the POST payload schema. Clients must now include both fields. Audience is always validated against the server origin.

## 1.17.2

### Patch Changes

- [#111](https://github.com/farcasterxyz/snap/pull/111) [`675720f`](https://github.com/farcasterxyz/snap/commit/675720f36b451cd4e3341ab558722b15d93ea252) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add per-component prop and action param validation to `validateSnapResponse` using the json-render catalog. Also makes `props` optional in the schema so elements with no required props (separator, stack) don't need `props: {}`.

## 1.17.1

### Patch Changes

- [#109](https://github.com/farcasterxyz/snap/pull/109) [`c6dc2c3`](https://github.com/farcasterxyz/snap/commit/c6dc2c3edf6101cf469723b1fa79ddce61f9e42b) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add `actionError` prop to React Native `SnapCard`, `SnapCardV1`, and `SnapCardV2` for displaying server-side action errors inline below the snap card.

## 1.17.0

### Minor Changes

- [#107](https://github.com/farcasterxyz/snap/pull/107) [`675d7ae`](https://github.com/farcasterxyz/snap/commit/675d7ae9e3f176c5a24f9ebb24de87b5ce62c389) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Add `actionError` prop to `SnapCard`, `SnapCardV1`, and `SnapCardV2` for displaying server-side action errors inline below the snap content.

## 1.16.3

### Patch Changes

- [#103](https://github.com/farcasterxyz/snap/pull/103) [`cb41e17`](https://github.com/farcasterxyz/snap/commit/cb41e17c0769aa14a98afa1b0be9d4337b4d7cd3) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Fix audience validation behind reverse proxies (e.g. ngrok). The origin fallback now checks X-Forwarded-Proto and X-Forwarded-Host headers to reconstruct the external origin instead of using the internal request URL.

## 1.16.2

### Patch Changes

- [#101](https://github.com/farcasterxyz/snap/pull/101) [`9b04d3b`](https://github.com/farcasterxyz/snap/commit/9b04d3b9b16ca03a3827ec7895a02f4c498c2f79) Thanks [@bob-obringer](https://github.com/bob-obringer)! - Deprecate optional nonce and audience in POST payload schema. Both fields will become required in a future major version. Servers now log a warning when either field is missing.

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
