import { Children, isValidElement, type ReactNode } from "react";

/**
 * True when every rendered child comes from a catalog `button` element.
 * json-render passes `{ element: { type, props, ... } }` into each catalog component.
 */
function isRenderableChild(c: ReactNode): boolean {
  if (c == null) return false;
  if (typeof c === "boolean") return false;
  return true;
}

export function horizontalChildrenAreAllButtons(children: ReactNode): boolean {
  const items = Children.toArray(children).filter(isRenderableChild);
  if (items.length === 0) return false;
  for (const child of items) {
    if (!isValidElement(child)) return false;
    const typ = (child.props as { element?: { type?: unknown } }).element?.type;
    if (typ !== "button") return false;
  }
  return true;
}

/** Direct snap catalog children under a stack (used for all-button grid column count). */
export function countRenderableChildren(children: ReactNode): number {
  return Children.toArray(children).filter(isRenderableChild).length;
}
