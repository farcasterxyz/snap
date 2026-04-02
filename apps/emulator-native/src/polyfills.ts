/**
 * Hermes / React Native do not define Node's `Buffer`. `@farcaster/jfs` (via
 * `encodePayload`) expects it at runtime.
 */
import { Buffer } from "buffer";

const g = globalThis as typeof globalThis & { Buffer: typeof Buffer };
if (typeof g.Buffer === "undefined") {
  g.Buffer = Buffer;
}
