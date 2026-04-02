const { getDefaultConfig } = require("expo/metro-config");

/**
 * Use Expo’s defaults for monorepos (watchFolders, node_modules paths). Do not set
 * `resolver.disableHierarchicalLookup` — with pnpm, Metro must resolve transitive
 * packages from nested `.pnpm` trees (e.g. `invariant`, `@ungap/structured-clone`, `expo-*`).
 */
const config = getDefaultConfig(__dirname);

/**
 * `@noble/hashes` exposes `./crypto` in `exports`, but its `browser` map points at
 * `./crypto.js`. Metro then resolves that path, which is not an export key, and logs
 * a warning. Remap to the supported subpath `@noble/hashes/crypto`.
 */
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "@noble/hashes/crypto.js" ||
    (typeof moduleName === "string" &&
      moduleName.endsWith("/@noble/hashes/crypto.js"))
  ) {
    return context.resolveRequest(
      context,
      "@noble/hashes/crypto",
      platform,
    );
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
