export const SNAP_PAGINATOR_PAGE_PATH = "/ui/paginator/page";
export const SNAP_PAGINATOR_PAGE_COUNT_PATH = "/ui/paginator/pageCount";

export type SnapPaginatorAction =
  | { action: "paginator_next" | "paginator_prev" }
  | { action: "paginator_go_to"; page?: number };

type StateStoreAccess = {
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
};

export function clampPaginatorPage(value: number, pageCount: number): number {
  return Math.min(Math.max(value, 0), Math.max(pageCount - 1, 0));
}

export function pageFromValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isInteger(value)
    ? value
    : fallback;
}

export function pageCountFromValue(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

export function getPaginatorAction(
  on: Record<string, unknown> | undefined,
): SnapPaginatorAction | null {
  const press = on?.press as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return null;
  if (press.action === "paginator_next") return { action: "paginator_next" };
  if (press.action === "paginator_prev") return { action: "paginator_prev" };
  if (press.action === "paginator_go_to") {
    const page = press.params?.page;
    return {
      action: "paginator_go_to",
      page: typeof page === "number" && Number.isInteger(page) ? page : 0,
    };
  }
  return null;
}

export function runPaginatorAction(
  store: StateStoreAccess,
  action: SnapPaginatorAction | null,
): boolean {
  if (!action) return false;
  const pageCount = pageCountFromValue(store.get(SNAP_PAGINATOR_PAGE_COUNT_PATH));
  if (pageCount === 0) return false;
  const currentPage = clampPaginatorPage(
    pageFromValue(store.get(SNAP_PAGINATOR_PAGE_PATH), 0),
    pageCount,
  );
  const nextPage =
    action.action === "paginator_next"
      ? currentPage + 1
      : action.action === "paginator_prev"
        ? currentPage - 1
        : (action as { action: "paginator_go_to"; page?: number }).page ?? 0;
  store.set(SNAP_PAGINATOR_PAGE_PATH, clampPaginatorPage(nextPage, pageCount));
  return true;
}
