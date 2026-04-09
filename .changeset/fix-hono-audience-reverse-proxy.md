---
"@farcaster/snap-hono": patch
---

Fix audience validation behind reverse proxies in the Hono handler. The origin derivation now checks X-Forwarded-Proto and X-Forwarded-Host headers before falling back to request.url.
