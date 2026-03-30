# snaps

## Learned User Preferences

- **Deep modules principle:** Each module (here, each workspace package under `pkgs/` or the repo root with its own `src/`) keeps a single public surface: `src/index.ts` must list that module’s exports. **All imports from outside the module go through that entry only** (package name such as `@farcaster/snap`, which resolve to `index.ts`). Do not import another package by reaching into its implementation paths (for example `…/snap/src/http` via relative file paths from a different package). Inside the same package, implementation files import each other with relative paths; do not re-export through random barrels—only `index.ts` aggregates what other packages may use. Do not use `export { … } from "./other"` or `export * from "./other"` in non-`index` implementation files as a shortcut for external consumers; add exports to `index.ts` instead.
- Do not use the `any` type in `pkgs/snap/src/schemas.ts` or `pkgs/snap/src/validator.ts`. Avoid `unknown` there except where required for external or untyped input (for example the top-level value passed into validation entrypoints). Prefer concrete types everywhere else.
- Prefer exporting shared string and enum values as constants from `pkgs/snap/src/schemas.ts` when they are used in schemas or validation logic.
- Validation errors use Zod’s issue `code` and `message` (plus `path`); there is no separate FC error-code layer or `errors.ts` barrel.
- Keep element and button reference details in focused markdown files under `spec/` (for example `elements.md`, `buttons.md`) instead of embedding everything in `SPEC.md` alone.
- **`agent-skills/` docs:** Prefer linking to `spec/` sources of truth instead of restating spec rules. For deployment platforms (for example Vercel), assume standard workflows and document only repo-specific details (workspace packages, paths, env vars).
- The primary “create a snap from a prompt” agent skill lives at `agent-skills/create-farcaster-snap/SKILL.md` on GitHub: https://github.com/farcasterxyz/snap/blob/main/agent-skills/create-farcaster-snap/SKILL.md (do not use the old `create-program.md` name).
- Prefer minimal public APIs: do not re-export types or helpers from adapter packages unless explicitly required; only export symbols that are externally consumed.
- Prefer explicit, predictable APIs over hidden convenience "magic" in wrappers; ergonomics should not obscure routing or behavior.
- `parseRequest` and related helpers use a `success` discriminant (`success: true` / `success: false`), not `ok`, when reporting parse outcomes; keep tests and callers aligned with that shape.

## Learned Workspace Facts

- Use pnpm for package management in this repository; do not use npm.
- The `pkgs/ui-elements` workspace package (`@farcaster/snap-ui-elements`) defines the json-render catalog; the emulator depends on it to render snaps.
- Local dev ports: emulator on 3000, `snap-template` on 3003; example apps under `examples/` use ports 3010 and higher with a distinct port per app.
- For snap HTTP GET, send `Accept: application/json+farcaster-snap`; example servers typically expose JSON on `/snap`, not on bare `/`.
- Local `registerSnapHandler` skips JFS **signature** verification when `NODE_ENV` is not `production`, but POST bodies must still be JFS-shaped JSON (`header` / `payload` / `signature`), including from `apps/emulator`. Set `SKIP_JFS_VERIFICATION=no` to require verification anyway, or `=yes` / `=1` to force bypass in production (dev-only).
- When using `FARCASTER_HUB_URL`, include the port (e.g. `https://rho.farcaster.xyz:3381`).
- Set `SNAP_PUBLIC_BASE_URL` to the canonical HTTPS origin (no trailing slash) so `page.buttons[].target` URLs resolve correctly.
- Snap hub verification uses the Hubble **HTTP** API only (no gRPC client). Hub URL helpers accept `http`/`https` with an explicit port or bare `host:port`; `grpc:`/`grpcs:` are invalid.
- In `apps/emulator`, **link** buttons first GET `/api/snap?url=…` for the resolved target; if the response is valid snap JSON, the emulator replaces the preview and syncs the Snap URL field, otherwise it opens the link in a new tab.
- For `apps/emulator` local dev on Next.js 16+, use `next dev -p 3000 --webpack` when forcing the Webpack dev server (supported flag). Do not use undocumented flags such as `--no-turbopack`.
- Snap POST authentication now relies on JFS request-body verification (`verifyJFSRequestBody`) as the single verification path; legacy header/signing verification flows were removed.
- `pkgs/snap` uses a post-build ESM import rewrite (`tsc-alias --resolve-full-paths --resolve-full-extension .js`) so Node ESM consumers can resolve `dist/*` imports (revisit: NodeNext + explicit `.js` sources). Turbo wires `dependsOn: ["^build"]` on `test`, `typecheck`, and `dev` so workspace packages build before dependents; `apps/emulator` runs `build:workspace-deps` in `predev` and `prebuild` for `@farcaster/snap` and `@farcaster/snap-ui-elements`.
