---
"@farcaster/snap-hono": minor
---

Add audience origin validation for v2 snap requests. The server now passes the request origin to `parseRequest` and handles the new `origin_mismatch` error case. Also improves origin detection to use `URL.origin` for more reliable parsing.
