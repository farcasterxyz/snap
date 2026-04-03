const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/**
 * Use Expo's defaults for monorepos (watchFolders, node_modules paths). Do not set
 * `resolver.disableHierarchicalLookup` — with pnpm, Metro must resolve transitive
 * packages from nested `.pnpm` trees (e.g. `invariant`, `@ungap/structured-clone`, `expo-*`).
 */
const config = getDefaultConfig(__dirname);

/**
 * pkgs/snap has `react` (and web peer deps) as devDependencies for building
 * the web export. pnpm installs these into pkgs/snap/node_modules/. When
 * Metro processes files inside pkgs/snap/src/react-native/, it finds that
 * copy of react first → dual React instances → hooks crash.
 *
 * Fix: intercept singleton packages in resolveRequest and force them to
 * resolve from this app's node_modules. `extraNodeModules` is NOT sufficient
 * because it's a fallback, not an override.
 */
const appNodeModules = path.resolve(__dirname, "node_modules");
const SINGLETONS = ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "react-native"];

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force singleton packages to resolve from the app's node_modules
  if (SINGLETONS.includes(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appNodeModules, ".shim") },
      moduleName,
      platform,
    );
  }

  // @noble/hashes workaround: `./crypto` browser map → `./crypto.js` which
  // isn't an export key. Remap to the supported subpath.
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
