---
"@farcaster/snap": major
"@farcaster/snap-hono": minor
---

This release upgrades `@farcaster/snap` to v2 and includes breaking changes to the POST payload schema.

Consumers must update requests that were sending the v1 payload shape:

- remove the previously required `nonce` field
- add the `user` field
- add the `surface` field
- treat `user` and `surface` as required in v2
- deprecate `fid` in favor of `user.fid`

v1-style payloads are not forward-compatible with v2; callers should update request construction before upgrading.

The easiest way to upgrade is to tell your agent `read https://docs.farcaster.xyz/snap/SKILL.md, then upgrade dependencies and the snap to the latest versions`
