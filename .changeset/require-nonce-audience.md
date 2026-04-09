---
"@farcaster/snap": minor
---

Make `nonce` and `audience` required in the POST payload schema. Clients must now include both fields. Audience is always validated against the server origin.
