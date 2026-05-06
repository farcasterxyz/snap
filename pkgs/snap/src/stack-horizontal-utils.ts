import { Children, isValidElement, type ReactNode } from "react";

import { shouldUseHorizontalButtonContent } from "./button-orientation-utils.js";

/**
 * True when every rendered child comes from a catalog `button` element.
 * json-render passes `{ element: { type, props, ... } }` into each catalog component.
 */
function isRenderableChild(c: ReactNode): boolean {
  if (c == null) return false;
  if (typeof c === "boolean") return false;
  return true;
}

export function childrenAreAllButtons(children: ReactNode): boolean {
  return getButtonChildLabels(children) !== undefined;
}

export function getButtonChildLabels(children: ReactNode): string[] | undefined {
  const items = Children.toArray(children).filter(isRenderableChild);
  if (items.length === 0) return undefined;
  const labels: string[] = [];
  for (const child of items) {
    if (!isValidElement(child)) return undefined;
    const element = (
      child.props as {
        element?: { type?: unknown; props?: Record<string, unknown> };
      }
    ).element;
    if (element?.type !== "button") return undefined;
    labels.push(String(element.props?.label ?? ""));
  }
  return labels;
}

export function childrenShouldUseHorizontalButtonLayout(
  children: ReactNode,
): boolean | undefined {
  const labels = getButtonChildLabels(children);
  return labels ? shouldUseHorizontalButtonContent(labels) : undefined;
}

/** Direct snap catalog children under a stack (used for horizontal gap defaults). */
export function countRenderableChildren(children: ReactNode): number {
  return Children.toArray(children).filter(isRenderableChild).length;
}

/**
 * Default horizontal stack gap as a t-shirt size, chosen by direct child count:
 * 2 children → lg, 3 children → md, 4+ children → sm. Unknown count falls back to md.
 * Tighter gaps for denser layouts; authors can always override via the `gap` prop.
 */
export function defaultHorizontalGapSize(
  childCount: number | undefined,
): "sm" | "md" | "lg" {
  if (childCount === undefined) return "md";
  if (childCount <= 2) return "lg";
  if (childCount === 3) return "md";
  return "sm";
}
