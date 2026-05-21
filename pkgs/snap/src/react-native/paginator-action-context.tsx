import { createContext, useContext } from "react";

type PaginatorActionHandlers = {
  next: () => void;
  previous: () => void;
  goTo: (page: number) => void;
};

export const SnapPaginatorActionContext =
  createContext<PaginatorActionHandlers | null>(null);

export function useSnapPaginatorActions() {
  return useContext(SnapPaginatorActionContext);
}

export function getPaginatorAction(
  on: Record<string, unknown> | undefined,
  props?: Record<string, unknown>,
):
  | { action: "paginator_next" | "paginator_previous" | "paginator_go_to"; page?: number }
  | null {
  const press = (props?.__snapPaginatorAction ?? on?.press) as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return null;

  if (press.action === "paginator_next") return { action: "paginator_next" };
  if (
    press.action === "paginator_previous" ||
    press.action === "paginator_prev"
  ) {
    return { action: "paginator_previous" };
  }
  if (press.action === "paginator_go_to") {
    const rawPage = press.params?.page;
    return {
      action: "paginator_go_to",
      page: typeof rawPage === "number" && Number.isInteger(rawPage) ? rawPage : 0,
    };
  }

  return null;
}

export function runPaginatorAction(
  actions: PaginatorActionHandlers | null,
  action:
    | { action: "paginator_next" | "paginator_previous" | "paginator_go_to"; page?: number }
    | null,
): boolean {
  if (!actions || !action) return false;
  if (action.action === "paginator_next") actions.next();
  if (action.action === "paginator_previous") actions.previous();
  if (action.action === "paginator_go_to") actions.goTo(action.page ?? 0);
  return true;
}
