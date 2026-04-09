---
"@farcaster/snap": minor
---

Add snap spec v2.0 support with structural validation, audience/nonce auth, and versioned rendering.

- New version constants: `SPEC_VERSION_1`, `SPEC_VERSION_2`, `SPEC_VERSION`
- Structural validation for v2 snaps: element count (64), root children (7), children per container (6), nesting depth (4)
- URL validation: HTTPS enforcement for action targets and image URLs
- `SnapCard` component now version-switches between v1 and v2 renderers with validation
- Removed unused `SnapView` export — use `SnapCard` instead
- `parseRequest` now validates audience origin for v2 snaps
- Versioned docs system with v1.0 and v2.0 content
