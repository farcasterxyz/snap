export const SPEC_VERSION_1 = "1.0" as const;
export const SPEC_VERSION_2 = "2.0" as const;
export const SPEC_VERSION = SPEC_VERSION_2;
export const SUPPORTED_SPEC_VERSIONS = [SPEC_VERSION_1, SPEC_VERSION_2] as const;
export type SpecVersion = (typeof SUPPORTED_SPEC_VERSIONS)[number];

export const MEDIA_TYPE = "application/vnd.farcaster.snap+json" as const;

export const EFFECT_VALUES = ["confetti"] as const;

// ─── Pixel grid ────────────────────────────────────────
export const POST_GRID_TAP_KEY = "grid_tap" as const;
export const GRID_MIN_COLS = 2;
export const GRID_MAX_COLS = 32;
export const GRID_MIN_ROWS = 2;
export const GRID_MAX_ROWS = 16;
export const GRID_GAP_VALUES = ["none", "sm", "md", "lg"] as const;

// ─── Snap structural limits ───────────────────────────
export const MAX_ELEMENTS = 64;
export const MAX_ROOT_CHILDREN = 7;
export const MAX_CHILDREN = 6;
export const MAX_DEPTH = 4;

// ─── Bar chart ─────────────────────────────────────────
export const BAR_CHART_MAX_BARS = 6;
export const BAR_CHART_LABEL_MAX_CHARS = 40;
