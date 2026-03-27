# Authentication

> Part of the [Farcaster Snaps spec](./SPEC.md) (draft).

Every POST request from the client to a snap server MUST be authenticated with **JSON Farcaster Signatures (JFS)**. See the [FIP: JSON Farcaster Signatures](https://github.com/farcasterxyz/protocol/discussions/208) discussion for the format and semantics.

## Replay protection

The request payload MUST contain a `timestamp` field (Unix seconds).

Servers SHOULD reject requests with timestamps outside an allowed skew (for example 5 minutes) to limit replay.

## Requirements

- The client MUST send a valid JFS for every authenticated POST.
- The server MUST verify the JFS cryptographically and MUST verify the signing key against hub (or equivalent) state for the FID.
- The server SHOULD enforce replay protection using `timestamp` (and any other policy you require).
