# Security Policy

## Supported Versions

We actively maintain and release security fixes for the following packages in this monorepo:

| Package | Support Status |
| --- | --- |
| `@farcaster/snap` (latest) | ✅ Actively supported |
| `@farcaster/snap-hono` (latest) | ✅ Actively supported |
| `@farcaster/snap-turso` (latest) | ✅ Actively supported |
| Older minor/patch versions | ❌ No backported fixes |

We recommend always using the latest published version from npm. Security fixes are released as patch versions and announced via GitHub Releases.

## Reporting a Vulnerability

**Please do not report security vulnerabilities via GitHub Issues, pull requests, or public discussion threads.**

If you discover a security vulnerability in this repository — including in `@farcaster/snap`, `@farcaster/snap-hono`, the emulator, or any example code — please report it privately using one of the following methods:

### Option 1: GitHub Private Security Advisory (Preferred)

Use GitHub's built-in private vulnerability reporting:

1. Go to [https://github.com/farcasterxyz/snap/security/advisories/new](https://github.com/farcasterxyz/snap/security/advisories/new)
2. Fill in the advisory form with as much detail as possible
3. Submit — the maintainers will be notified privately

### Option 2: Email

Send a report to **security@merkle.xyz** with:

- A description of the vulnerability and affected component
- Steps to reproduce or a proof-of-concept
- Potential impact assessment
- Your GitHub handle (optional, for credit)

We aim to acknowledge reports within **48 hours** and provide a resolution timeline within **7 days**.

## Scope

The following are **in scope** for security reports:

- Vulnerabilities in `validateSnapResponse` / `validateImageUrl` / structural validators that could allow malicious snap payloads to bypass validation
- Issues in `verifyJFSRequestBody` that could allow signature forgery or replay attacks
- Prototype pollution or injection vulnerabilities in snap response parsing
- Vulnerabilities in the snap emulator (`apps/emulator`) that could compromise developer machines
- Dependencies with known CVEs that are directly exploitable via this package's public API
- XSS or script injection via snap UI elements (image URLs, action targets, open_url/open_mini_app params)

The following are **out of scope**:

- Vulnerabilities in third-party packages not controlled by this repo (report directly to upstream)
- Theoretical vulnerabilities without a realistic attack vector
- Issues in example code that are clearly marked as non-production demos
- Self-XSS or issues requiring physical access to a device

## Security Considerations for Snap Authors

If you are building a snap server using `@farcaster/snap` or `@farcaster/snap-hono`, please be aware of the following:

### Always verify POST request signatures

Do not trust the `fid` in the POST payload without cryptographic verification. Use `verifyJFSRequestBody` to verify that the request was signed by the claimed Farcaster user:

```ts
import { verifyJFSRequestBody } from '@farcaster/snap';

// In your POST handler:
const verified = await verifyJFSRequestBody(request);
if (!verified) {
  return new Response('Unauthorized', { status: 401 });
}
```

Skipping this check allows any client to forge requests on behalf of any FID.

### Validate all snap responses

Always run `validateSnapResponse` on dynamically-constructed snap responses before serving them, especially if any part of the response is built from user input or external data.

### Image and URL security

- Only serve image URLs you control or trust. The validator enforces HTTPS and extension checks, but cannot verify that the remote image content is safe.
- `open_url` and `open_mini_app` action targets are validated as HTTPS URLs — do not construct these dynamically from untrusted input.

### Emulator note

The local emulator (`@farcaster/snap-emulator`) does **not** sign requests with real private keys. Do not use emulator-mode responses in production or bypass signature verification based on emulator headers.

## Disclosure Policy

We follow a **coordinated disclosure** process:

1. Reporter submits vulnerability privately
2. Maintainers confirm, triage, and assign a severity (CVSS)
3. Fix is developed on a private branch
4. Fix is released as a patch version
5. A GitHub Security Advisory is published
6. Reporter is credited (unless they prefer anonymity)

We ask reporters to keep the vulnerability confidential until a fix has been released.

## Acknowledgements

We sincerely thank all researchers and community members who responsibly disclose vulnerabilities to us. Contributors who report valid security issues will be credited in the relevant GitHub Security Advisory.
