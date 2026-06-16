---
"@farcaster/snap": patch
---

Add Snap client actions for EVM transaction requests.

Snaps can now bind `send_transaction` for single `eth_sendTransaction` requests
and `send_calls` for EIP-5792-style `wallet_sendCalls` batches. Both handlers
are optional for hosts.
