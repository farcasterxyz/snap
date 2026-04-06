export type {
  Spec as SnapSpec,
  UIElement as SnapUIElement,
} from "@json-render/core";
export { SPEC_VERSION, MEDIA_TYPE, EFFECT_VALUES } from "./constants";
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
  type SnapFunction,
  type SnapPayload,
} from "./schemas";
export { validateSnapResponse, type ValidationResult } from "./validator";
export { type Middleware, useMiddleware } from "./middleware";
