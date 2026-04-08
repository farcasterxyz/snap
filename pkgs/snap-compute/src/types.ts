export type SnapValue =
  | { type: "null" }
  | { type: "bool"; value: boolean }
  | { type: "i64"; value: bigint }
  | { type: "f64"; value: number }
  | { type: "string"; value: string }
  | { type: "bytes"; value: Uint8Array }
  | { type: "array"; value: SnapValue[] }
  | { type: "map"; value: Map<string, SnapValue> };

export const snapNull = (): SnapValue => ({ type: "null" });
export const snapBool = (v: boolean): SnapValue => ({ type: "bool", value: v });
export const snapI64 = (v: bigint | number): SnapValue => ({
  type: "i64",
  value: typeof v === "number" ? BigInt(v) : v,
});
export const snapF64 = (v: number): SnapValue => ({ type: "f64", value: v });
export const snapString = (v: string): SnapValue => ({
  type: "string",
  value: v,
});
export const snapBytes = (v: Uint8Array): SnapValue => ({
  type: "bytes",
  value: v,
});
export const snapArray = (v: SnapValue[]): SnapValue => ({
  type: "array",
  value: v,
});
export const snapMap = (
  entries: Array<[string, SnapValue]>,
): SnapValue => ({
  type: "map",
  value: new Map(entries),
});

export function isTruthy(v: SnapValue): boolean {
  switch (v.type) {
    case "null":
      return false;
    case "bool":
      return v.value;
    case "i64":
      return v.value !== 0n;
    case "f64":
      return v.value !== 0 && !Number.isNaN(v.value);
    case "string":
      return v.value.length > 0;
    case "bytes":
      return v.value.length > 0;
    case "array":
      return v.value.length > 0;
    case "map":
      return v.value.size > 0;
  }
}

export function snapValuesEqual(a: SnapValue, b: SnapValue): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "null":
      return true;
    case "bool":
      return a.value === (b as typeof a).value;
    case "i64":
      return a.value === (b as typeof a).value;
    case "f64":
      return a.value === (b as typeof a).value;
    case "string":
      return a.value === (b as typeof a).value;
    case "bytes": {
      const bb = (b as typeof a).value;
      if (a.value.length !== bb.length) return false;
      for (let i = 0; i < a.value.length; i++)
        if (a.value[i] !== bb[i]) return false;
      return true;
    }
    case "array": {
      const ba = (b as typeof a).value;
      if (a.value.length !== ba.length) return false;
      for (let i = 0; i < a.value.length; i++)
        if (!snapValuesEqual(a.value[i]!, ba[i]!)) return false;
      return true;
    }
    case "map": {
      const bm = (b as typeof a).value;
      if (a.value.size !== bm.size) return false;
      for (const [k, v] of a.value) {
        const bv = bm.get(k);
        if (bv === undefined || !snapValuesEqual(v, bv)) return false;
      }
      return true;
    }
  }
}

export function snapValueToJSON(v: SnapValue): unknown {
  switch (v.type) {
    case "null":
      return null;
    case "bool":
      return v.value;
    case "i64":
      return Number(v.value);
    case "f64":
      return v.value;
    case "string":
      return v.value;
    case "bytes":
      return Array.from(v.value);
    case "array":
      return v.value.map(snapValueToJSON);
    case "map": {
      const obj: Record<string, unknown> = {};
      for (const [k, val] of v.value) obj[k] = snapValueToJSON(val);
      return obj;
    }
  }
}

export function jsonToSnapValue(v: unknown): SnapValue {
  if (v === null || v === undefined) return snapNull();
  if (typeof v === "boolean") return snapBool(v);
  if (typeof v === "number") {
    return Number.isInteger(v) ? snapI64(BigInt(v)) : snapF64(v);
  }
  if (typeof v === "bigint") return snapI64(v);
  if (typeof v === "string") return snapString(v);
  if (v instanceof Uint8Array) return snapBytes(v);
  if (Array.isArray(v)) return snapArray(v.map(jsonToSnapValue));
  if (typeof v === "object") {
    const entries: Array<[string, SnapValue]> = Object.entries(
      v as Record<string, unknown>,
    ).map(([k, val]) => [k, jsonToSnapValue(val)]);
    return snapMap(entries);
  }
  return snapNull();
}

export function compareSnapValues(a: SnapValue, b: SnapValue): number {
  if (a.type === "i64" && b.type === "i64") {
    return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  }
  if (a.type === "f64" && b.type === "f64") {
    return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  }
  if (a.type === "i64" && b.type === "f64") {
    const af = Number(a.value);
    return af < b.value ? -1 : af > b.value ? 1 : 0;
  }
  if (a.type === "f64" && b.type === "i64") {
    const bf = Number(b.value);
    return a.value < bf ? -1 : a.value > bf ? 1 : 0;
  }
  if (a.type === "string" && b.type === "string") {
    return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  }
  throw new Error(`Cannot compare ${a.type} and ${b.type}`);
}

// ─── Snap Compute execution types ──────────────────────────────

export interface SnapStateWrite {
  key: string;
  value: Uint8Array;
}

export type SnapCapability = "shared_state" | "user_state" | "cast" | "react" | "link" | "user_data";

export interface SnapCapabilityApproval {
  snapCastHash: Uint8Array;
  fid: bigint;
  capabilities: SnapCapability[];
  signature: Uint8Array;
}

export interface SnapExecutionBundle {
  snapCastHash: Uint8Array;
  fid: bigint;
  timestamp: number;
  nonce: Uint8Array;
  approval: SnapCapabilityApproval;
  action: "get" | "post";
  inputs: Map<string, Uint8Array>;
  buttonIndex: number;
  userStateWrites: SnapStateWrite[];
  sharedStateWrites: SnapStateWrite[];
  embeddedMessages: Uint8Array[];
  signer: Uint8Array;
  signature: Uint8Array;
}

export interface EmittedMessage {
  type: "cast" | "react" | "unreact" | "follow" | "unfollow" | "user_data";
  args: SnapValue[];
}
