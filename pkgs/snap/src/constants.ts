export const SPEC_VERSION = "1.0" as const;
export const SPEC_VERSION_COMPUTE = "1.1" as const;

export const MEDIA_TYPE = "application/vnd.farcaster.snap+json" as const;

export const EFFECT_VALUES = ["confetti"] as const;

// ─── Pixel grid ────────────────────────────────────────
export const POST_GRID_TAP_KEY = "grid_tap" as const;
export const GRID_MIN_COLS = 2;
export const GRID_MAX_COLS = 32;
export const GRID_MIN_ROWS = 2;
export const GRID_MAX_ROWS = 16;
export const GRID_GAP_VALUES = ["none", "sm", "md", "lg"] as const;

// ─── Bar chart ─────────────────────────────────────────
export const BAR_CHART_MAX_BARS = 6;
export const BAR_CHART_LABEL_MAX_CHARS = 40;
