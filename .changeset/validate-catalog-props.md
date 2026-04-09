---
"@farcaster/snap": patch
---

Add per-component prop and action param validation to `validateSnapResponse` using the json-render catalog. Also makes `props` optional in the schema so elements with no required props (separator, stack) don't need `props: {}`.
