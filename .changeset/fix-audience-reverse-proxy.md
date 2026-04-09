---
"@farcaster/snap": patch
---

Fix audience validation behind reverse proxies (e.g. ngrok). The origin fallback now checks X-Forwarded-Proto and X-Forwarded-Host headers to reconstruct the external origin instead of using the internal request URL.
