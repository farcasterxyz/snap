---
"@farcaster/snap": patch
---

docs(llms.txt): add ESM import rule to `llms.txt` — local relative imports in the snap template must include `.js` (e.g. `./foo.js`), otherwise deploys fail with `500 FUNCTION_INVOCATION_FAILED` (NEYN-10450).
