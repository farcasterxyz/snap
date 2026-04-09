---
"@farcaster/snap": patch
---

Deprecate optional nonce and audience in POST payload schema. Both fields will become required in a future major version. Servers now log a warning when either field is missing.
