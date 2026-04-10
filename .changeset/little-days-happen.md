---
"@farcaster/snap": major
---

This release upgrades `@farcaster/snap` to v2 and includes breaking changes to the POST payload schema.

Consumers must update requests that were sending the v1 payload shape:

- remove the previously required `nonce` field
- add the `user` field
- add the `surface` field
- treat `user` and `surface` as required in v2

v1-style payloads are not forward-compatible with v2; callers should update request construction before upgrading.
