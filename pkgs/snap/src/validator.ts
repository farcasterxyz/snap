import { z } from "zod";
import {
  BUTTON_GROUP_STYLE,
  DEFAULT_BUTTON_LAYOUT,
  ELEMENT_TYPE,
  LIMITS,
  SPACER_SIZE,
  TEXT_STYLE,
} from "./constants";
import { type Button, type Element } from "./elements";
import {
  firstPageResponseSchema,
  snapResponseSchema,
  type SnapResponse,
} from "./schemas";

export type ValidationResult = {
  valid: boolean;
  issues: z.core.$ZodIssue[];
};

/** Not in SPEC — rough px used only for {@link measureHeightBudget}. */
const PAGE_HEIGHT_HEURISTIC = {
  baseChromePx: 32,
  elementGapPx: 12,
  buttonRowPx: 48,
} as const;

function estimateElementHeight(el: Element): number {
  switch (el.type) {
    case ELEMENT_TYPE.text: {
      const style = el.style;
      if (style === TEXT_STYLE.title) return 48;
      if (style === TEXT_STYLE.body) return 80;
      if (style === TEXT_STYLE.caption) return 36;
      if (style === TEXT_STYLE.label) return 24;
      return 48;
    }
    case ELEMENT_TYPE.image:
      return 180;
    case ELEMENT_TYPE.grid:
      return 180;
    case ELEMENT_TYPE.progress:
      return 32;
    case ELEMENT_TYPE.list: {
      const items = el.items;
      const n = Array.isArray(items) ? items.length : 0;
      return Math.min(n, LIMITS.maxListItems) * 30;
    }
    case ELEMENT_TYPE.slider:
      return 56;
    case ELEMENT_TYPE.button_group: {
      const options = Array.isArray(el.options) ? el.options : [];
      const style =
        el.style ??
        (options.length <= 3
          ? BUTTON_GROUP_STYLE.row
          : BUTTON_GROUP_STYLE.stack);
      if (style === BUTTON_GROUP_STYLE.row)
        return PAGE_HEIGHT_HEURISTIC.buttonRowPx;
      if (style === BUTTON_GROUP_STYLE.grid) {
        return (
          Math.ceil(options.length / 2) * PAGE_HEIGHT_HEURISTIC.buttonRowPx
        );
      }
      return options.length * PAGE_HEIGHT_HEURISTIC.buttonRowPx;
    }
    case ELEMENT_TYPE.text_input:
      return 44;
    case ELEMENT_TYPE.toggle:
      return 40;
    case ELEMENT_TYPE.divider:
      return 16;
    case ELEMENT_TYPE.spacer: {
      const size = el.size ?? SPACER_SIZE.medium;
      if (size === SPACER_SIZE.small) return 8;
      if (size === SPACER_SIZE.large) return 24;
      return 16;
    }
    case ELEMENT_TYPE.bar_chart:
      return 140; // fixed: 120px bars + 20px labels
    case ELEMENT_TYPE.group: {
      let maxH = 0;
      for (const child of el.children) {
        const h = estimateElementHeight(child);
        if (h > maxH) maxH = h;
      }
      return maxH || 56;
    }
    default: {
      const _exhaustive: never = el;
      return _exhaustive;
    }
  }
}

function estimateButtonsHeight(
  buttons: readonly Button[],
  buttonLayout: string,
): number {
  const rowPx = PAGE_HEIGHT_HEURISTIC.buttonRowPx;
  if (buttons.length === 0) return 0;
  if (buttonLayout === BUTTON_GROUP_STYLE.row) return rowPx;
  if (buttonLayout === BUTTON_GROUP_STYLE.grid) {
    return Math.ceil(buttons.length / 2) * rowPx;
  }
  return buttons.length * rowPx;
}

function measureHeightBudget(
  elements: readonly Element[],
  buttons: readonly Button[],
  buttonLayout: string,
): number {
  let totalHeight = PAGE_HEIGHT_HEURISTIC.baseChromePx;

  for (const el of elements) {
    totalHeight += estimateElementHeight(el);
  }

  if (elements.length > 1) {
    totalHeight += (elements.length - 1) * PAGE_HEIGHT_HEURISTIC.elementGapPx;
  }

  totalHeight += estimateButtonsHeight(buttons, buttonLayout);
  return totalHeight;
}

function heightBudgetValidationError(
  elements: readonly Element[],
  buttons: readonly Button[],
  buttonLayout: string,
): z.core.$ZodIssue | null {
  const totalHeight = measureHeightBudget(elements, buttons, buttonLayout);
  if (totalHeight <= LIMITS.maxEstimatedPageHeightPx) {
    return null;
  }
  return {
    code: "custom",
    message: `estimated page height is ~${totalHeight}px, which exceeds the ${LIMITS.maxEstimatedPageHeightPx}px feed card limit (expected max ~${LIMITS.maxEstimatedPageHeightPx}px). Reduce elements or buttons to fit.`,
    path: ["page"],
  };
}

function heightBudgetValidationErrorForRoot(
  root: SnapResponse,
): z.core.$ZodIssue | null {
  const layout =
    typeof root.page.button_layout === "string"
      ? root.page.button_layout
      : DEFAULT_BUTTON_LAYOUT;
  return heightBudgetValidationError(
    root.page.elements.children,
    root.page.buttons ?? [],
    layout,
  );
}

export function validateSnapResponse(json: unknown): ValidationResult {
  const parsed = snapResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues,
    };
  }

  const heightErr = heightBudgetValidationErrorForRoot(parsed.data);
  if (heightErr) {
    return { valid: false, issues: [heightErr] };
  }

  return { valid: true, issues: [] };
}

export function validateFirstPageResponse(json: unknown): ValidationResult {
  const parsed = firstPageResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues,
    };
  }

  const heightErr = heightBudgetValidationErrorForRoot(parsed.data);
  if (heightErr) {
    return { valid: false, issues: [heightErr] };
  }

  return { valid: true, issues: [] };
}
