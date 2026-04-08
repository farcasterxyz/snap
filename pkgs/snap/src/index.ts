export type {
  Spec as SnapSpec,
  UIElement as SnapUIElement,
} from "@json-render/core";
export {
  SPEC_VERSION,
  SPEC_VERSION_1,
  SPEC_VERSION_2,
  SUPPORTED_SPEC_VERSIONS,
  type SpecVersion,
  MEDIA_TYPE,
  EFFECT_VALUES,
  POST_GRID_TAP_KEY,
  MAX_ELEMENTS,
  MAX_ROOT_CHILDREN,
  MAX_CHILDREN,
  MAX_DEPTH,
} from "./constants";
export {
  DEFAULT_THEME_ACCENT,
  PALETTE_COLOR,
  PALETTE_COLOR_ACCENT,
  PALETTE_COLOR_VALUES,
  PALETTE_LIGHT_HEX,
  PALETTE_DARK_HEX,
  type PaletteColor,
} from "./colors";
export {
  ACTION_TYPE_GET,
  ACTION_TYPE_POST,
  snapResponseSchema,
  payloadSchema,
  type SnapAction,
  type SnapContext,
  type SnapResponse,
  type SnapHandlerResult,
  type SnapElementInput,
  type SnapSpecInput,
  type SnapFunction,
  type SnapPayload,
} from "./schemas";
export { validateSnapResponse, type ValidationResult } from "./validator";
