#!/usr/bin/env bash
# Build a .tar.gz for https://host.neynar.app with framework=hono.
# The archive root is the Hono app (src/, package.json) plus packages/snap and packages/hono;
# Vercel's Hono builder only looks for src/index.ts at the project root.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d "/tmp/neynar-snap-template-bundle.XXXXXX")"

mkdir -p "$STAGE/packages"
cp -R "$REPO_ROOT/packages/snap" "$STAGE/packages/snap"
cp -R "$REPO_ROOT/packages/hono" "$STAGE/packages/hono"
cp -R "$REPO_ROOT/template/src" "$STAGE/src"
cp "$REPO_ROOT/template/package.json" "$STAGE/package.json"
cp "$REPO_ROOT/template/tsconfig.json" "$STAGE/tsconfig.json"

cat > "$STAGE/pnpm-workspace.yaml" << 'EOF'
packages:
  - "packages/*"
EOF

cat > "$STAGE/vercel.json" << 'EOF'
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter snap run build && pnpm --filter snap-hono run build"
}
EOF

find "$STAGE" \( -name node_modules -o -name dist \) -type d -exec rm -rf {} + 2>/dev/null || true

(cd "$STAGE" && pnpm install --no-frozen-lockfile)
rm -rf "$STAGE/node_modules" "$STAGE/packages/snap/node_modules" "$STAGE/packages/hono/node_modules"

OUT="${1:-/tmp/neynar-snap-template-hono.tar.gz}"
tar czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"
echo "$OUT"
