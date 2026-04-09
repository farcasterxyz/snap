---
"@farcaster/snap": patch
---

Make nonce and audience optional in POST payload schema for backward compatibility with existing clients. When present, audience is validated against the server origin.
