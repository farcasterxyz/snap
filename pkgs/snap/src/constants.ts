export const POST_GRID_TAP_KEY = "grid_tap" as const;

export const SPEC_VERSION = "1.0" as const;

export const MEDIA_TYPE = "application/vnd.farcaster.snap+json" as const;

export const LIMITS = {
  maxElementsPerPage: 5,
  maxButtonsPerPage: 4,
  maxTextInputChars: 280,
  maxListItems: 4,
  minListItems: 1,
  minButtonGroupOptions: 2,
  maxButtonGroupOptions: 4,
  maxButtonGroupOptionChars: 40,
  maxButtonLabelChars: 30,
  listItemContentMaxChars: 100,
  listItemTrailingMaxChars: 40,
  minGridCols: 2,
  maxGridCols: 64,
  minGridRows: 2,
  maxGridRows: 8,
  minGroupChildren: 2,
  maxGroupChildren: 3,
  maxBarChartBars: 6,
  barChartLabelMaxChars: 40,
  maxEstimatedPageHeightPx: 500,
} as const;

export const TEXT_STYLE = {
  title: "title",
  body: "body",
  caption: "caption",
  label: "label",
} as const;

export const TEXT_STYLE_VALUES = [
  TEXT_STYLE.title,
  TEXT_STYLE.body,
  TEXT_STYLE.caption,
  TEXT_STYLE.label,
] as const;

export const TEXT_ALIGN_VALUES = ["left", "center", "right"] as const;
export const IMAGE_ASPECT_VALUES = [
  "1:1",
  "16:9",
  "4:3",
  "3:4",
  "9:16",
] as const;

export const SPACER_SIZE = {
  small: "small",
  medium: "medium",
  large: "large",
} as const;

export const SPACER_SIZE_VALUES = [
  SPACER_SIZE.small,
  SPACER_SIZE.medium,
  SPACER_SIZE.large,
] as const;

export const LIST_STYLE_VALUES = ["ordered", "unordered", "plain"] as const;

export const DEFAULT_LIST_STYLE = "ordered" as const;

export const GRID_CELL_SIZE_VALUES = ["auto", "square"] as const;
export const GRID_GAP_VALUES = ["none", "small", "medium"] as const;

export const BUTTON_GROUP_STYLE = {
  row: "row",
  stack: "stack",
  grid: "grid",
} as const;

export const BUTTON_GROUP_STYLE_VALUES = [
  BUTTON_GROUP_STYLE.row,
  BUTTON_GROUP_STYLE.stack,
  BUTTON_GROUP_STYLE.grid,
] as const;

export const BUTTON_ACTION = {
  post: "post",
  link: "link",
  mini_app: "mini_app",
  sdk: "sdk",
} as const;

export const BUTTON_ACTION_VALUES = [
  BUTTON_ACTION.post,
  BUTTON_ACTION.link,
  BUTTON_ACTION.mini_app,
  BUTTON_ACTION.sdk,
] as const;

export const BUTTON_STYLE = {
  primary: "primary",
  secondary: "secondary",
} as const;

export const BUTTON_STYLE_VALUES = [
  BUTTON_STYLE.primary,
  BUTTON_STYLE.secondary,
] as const;

export const BUTTON_LAYOUT_VALUES = ["stack", "row", "grid"] as const;
export const DEFAULT_BUTTON_LAYOUT = BUTTON_LAYOUT_VALUES[0];

export const EFFECT_VALUES = ["confetti"] as const;

export const GROUP_LAYOUT_VALUES = ["row"] as const;

/** Only valid as `page.elements`: vertical container for the page body (matches json-render trees). */
export const PAGE_ROOT_TYPE = {
  stack: "stack",
} as const;

export const ELEMENT_TYPE = {
  text: "text",
  image: "image",
  divider: "divider",
  spacer: "spacer",
  progress: "progress",
  list: "list",
  grid: "grid",
  text_input: "text_input",
  slider: "slider",
  button_group: "button_group",
  toggle: "toggle",
  group: "group",
  bar_chart: "bar_chart",
} as const;

export type ElementType = (typeof ELEMENT_TYPE)[keyof typeof ELEMENT_TYPE];

export const HTTPS_PREFIX = "https://" as const;
export const HTTP_PREFIX = "http://" as const;

/** 6-digit hex only (#RRGGBB); used for grid cell backgrounds (free hex). */
export const HEX_COLOR_6_RE = /^#[0-9a-fA-F]{6}$/;

export const TEXT_CONTENT_MAX = {
  [TEXT_STYLE.title]: 80,
  [TEXT_STYLE.body]: 160,
  [TEXT_STYLE.caption]: 100,
  [TEXT_STYLE.label]: 40,
} as const satisfies Record<(typeof TEXT_STYLE_VALUES)[number], number>;

export const SLIDER_STEP_ALIGN_EPS = 1e-6;
export const DEFAULT_SLIDER_STEP = 1 as const;

export const MEDIA_ELEMENT_TYPES = [
  ELEMENT_TYPE.image,
  ELEMENT_TYPE.grid,
] as ElementType[];

export const INTERACTIVE_ELEMENT_TYPES = [
  ELEMENT_TYPE.button_group,
  ELEMENT_TYPE.slider,
  ELEMENT_TYPE.text_input,
  ELEMENT_TYPE.toggle,
] as ElementType[];
