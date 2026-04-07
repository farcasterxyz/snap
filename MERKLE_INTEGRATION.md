# Integrating `@farcaster/snap/react-native` into the Merkle Native App

## Background

We just shipped `@farcaster/snap@1.7.0` which exports a React Native component library at `@farcaster/snap/react-native`. This renders Farcaster Snaps natively — no WebView needed.

The package provides a single `<SnapView>` component that:
- Accepts a snap response (`{ version, theme, effects, ui }`) — the `ui` field is a `@json-render/core` `Spec`
- Accepts typed `SnapActionHandlers` for all 9 client actions (submit, open_url, open_mini_app, view_cast, view_profile, compose_cast, view_token, send_token, swap_token)
- Accepts `appearance: "light" | "dark"` and optional `colors?: Partial<SnapNativeColors>` for theme injection
- Internally renders 16 component types (text, stack, button, badge, icon, image, input, item, item_group, progress, separator, slider, switch, toggle_group, bar_chart, cell_grid) via `@json-render/react-native`
- Handles state management, accent theming, input collection, and action dispatch

The component library was extracted from our working React Native emulator. It's been tested and is running in production in our emulator app.

## Required Dependencies

Add to `farcaster-mobile` (or whichever package renders snaps):

```
@farcaster/snap@^1.7.0
@json-render/core@^0.15.0
@json-render/react-native@^0.15.0
```

These are already peer deps of the consuming components. Additionally needed (likely already in the app):
- `lucide-react-native` (icons — the app already has this at 0.542.0, any version works)
- `expo-image` (image rendering)
- `@react-native-community/slider` (slider input)

## Basic Integration

```tsx
import { SnapView, type SnapActionHandlers, type SnapPage, type SnapNativeColors } from "@farcaster/snap/react-native";

function SnapRenderer({ snap, loading }: { snap: SnapPage; loading: boolean }) {
  const theme = useTheme(); // Merkle's theme hook

  // Map Merkle's theme tokens to snap's 7 flat color tokens
  const colors: SnapNativeColors = useMemo(() => ({
    bg: theme.colors.background.default,
    surface: theme.colors.background.primary,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border.primary,
    inputBg: theme.colors.background.primary,
    muted: theme.colors.background.secondary,
  }), [theme]);

  // Wire up action handlers to app navigation/wallet flows
  const handlers: SnapActionHandlers = useMemo(() => ({
    submit: (target, inputs) => {
      // POST inputs back to the snap server, get next page
    },
    open_url: (target) => {
      // In-app browser or Linking.openURL
    },
    open_mini_app: (url) => {
      // Navigate to mini-app screen
    },
    view_cast: ({ hash }) => {
      // Navigate to cast detail screen
    },
    view_profile: ({ fid }) => {
      // Navigate to profile screen
    },
    compose_cast: ({ text, channelKey, embeds }) => {
      // Open compose sheet
    },
    view_token: ({ token }) => {
      // Navigate to token screen
    },
    send_token: ({ token, amount, recipientFid, recipientAddress }) => {
      // Open send flow
    },
    swap_token: ({ sellToken, buyToken }) => {
      // Open swap flow
    },
  }), []);

  return (
    <SnapView
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={theme.dark ? "dark" : "light"}
      colors={colors}
    />
  );
}
```

## The SnapPage Type

The snap response that `SnapView` expects:

```typescript
type SnapPage = {
  version: string;              // "1.0"
  theme?: { accent?: string };  // palette color name like "purple", "blue", "red"
  effects?: string[];           // ["confetti"] (not yet supported on native)
  ui: Spec;                     // @json-render/core Spec: { root, elements, state? }
};
```

The `ui` field is a flat JSON structure with `{ root: string, elements: Record<string, UIElement>, state?: object }`. Each `UIElement` has `{ type, props, children?, on? }`. The `@json-render/react-native` renderer handles all of this — you just pass the spec through.

## SnapNativeColors — The Theme Contract

Only 7 string color tokens. All optional (defaults provided for light/dark):

```typescript
type SnapNativeColors = {
  bg: string;           // page background
  surface: string;      // card/container background
  text: string;         // primary text color
  textSecondary: string; // secondary/muted text
  border: string;       // border color
  inputBg: string;      // input field backgrounds
  muted: string;        // muted/faint backgrounds (e.g. progress track)
};
```

## CRITICAL: Metro + pnpm Singleton Fix

`@farcaster/snap` has `react` as a devDependency (needed for building its web export). pnpm installs this into `@farcaster/snap`'s own `node_modules/react`. When Metro bundles files that import from `@farcaster/snap/react-native`, it finds this copy of React first instead of the app's copy — causing dual React instances and "Invalid hook call" crashes.

**`extraNodeModules` does NOT fix this** — it's a fallback, not an override.

**The fix**: Use `resolveRequest` in `metro.config.js` to intercept singleton packages:

```js
const path = require("path");

// Add to metro.config.js — force singleton packages to resolve from the app
const appNodeModules = path.resolve(__dirname, "node_modules");
const SINGLETONS = ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "react-native"];

// Wrap your existing resolveRequest or set a new one:
const existingResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETONS.includes(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appNodeModules, ".shim") },
      moduleName,
      platform,
    );
  }
  if (existingResolveRequest) {
    return existingResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
```

This overrides `originModulePath` so Metro resolves from the app's `node_modules` instead of walking up from the package's source directory.

## Reference: Working Emulator Integration

Here's how our emulator wires it up (thin wrapper pattern):

```tsx
import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SnapView, type SnapActionHandlers, type SnapPage } from "@farcaster/snap/react-native";

export function SnapPreview({ snap, loading, onSubmit, onOpenUrl }) {
  const { mode, colors } = useTheme(); // your theme hook

  const handlers = useMemo<SnapActionHandlers>(() => ({
    submit: (target, inputs) => onSubmit(target, inputs),
    open_url: (target) => onOpenUrl(target),
    open_mini_app: (url) => { /* navigate */ },
    view_cast: ({ hash }) => { /* navigate */ },
    view_profile: ({ fid }) => { /* navigate */ },
    compose_cast: ({ text }) => { /* open composer */ },
    view_token: ({ token }) => { /* navigate */ },
    send_token: ({ token }) => { /* open send */ },
    swap_token: ({ sellToken, buyToken }) => { /* open swap */ },
  }), [onSubmit, onOpenUrl]);

  return (
    <SnapView
      snap={snap as SnapPage}
      handlers={handlers}
      loading={loading}
      appearance={mode}
      colors={colors}
    />
  );
}
```

## Source Code Reference

The full source lives at:
- Package: `/Users/bobringer/work/neynar/code/snap/pkgs/snap/src/react-native/`
- Emulator integration: `/Users/bobringer/work/neynar/code/snap/apps/emulator-native/src/components/SnapPreview.tsx`
- Metro config with singleton fix: `/Users/bobringer/work/neynar/code/snap/apps/emulator-native/metro.config.js`
- GitHub: https://github.com/farcasterxyz/snap (PRs #40, #46)

## Merkle Monorepo Notes

- App: `apps/farcaster-mobile` — React Native 0.79.4, Expo 53, React 19.0.0
- Theme: `packages/farcaster-expo` provides `useTheme()` → `{ dark, colors: { background, text, border, ... } }`
- The web app already uses `@json-render/react` for snap rendering in `apps/farcaster-web/src/components/snap/`
- MiniApps currently render via WebView in `apps/farcaster-mobile/src/components/MiniApp/MiniApp.tsx`
- `lucide-react-native` is already installed (0.542.0)
- I haven't run the emulator over there before, so the initial setup might need some figuring out
