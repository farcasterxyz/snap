export {
  POST_GRID_TAP_KEY,
  PAGE_ROOT_TYPE,
  ELEMENT_TYPE,
  MEDIA_TYPE,
  DEFAULT_THEME_ACCENT,
  DEFAULT_LIST_STYLE,
  DEFAULT_SLIDER_STEP,
  PALETTE_COLOR,
  PALETTE_COLOR_VALUES,
  PALETTE_LIGHT_HEX,
  PALETTE_DARK_HEX,
  type PaletteColor,
} from "./constants";
export {
  rootSchema,
  firstPageRootSchema,
  payloadSchema,
  type SnapAction,
  type SnapContext,
  type SnapResponse,
  type SnapResponseInput,
  type SnapFunction,
  type SnapPayload,
} from "./schemas";
export {
  validatePage,
  validateFirstPage,
  type ValidationResult,
} from "./validator";
