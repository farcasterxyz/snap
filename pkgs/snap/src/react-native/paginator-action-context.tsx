import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

type PaginatorActionHandlers = {
  next: () => void;
  previous: () => void;
  goTo: (page: number) => void;
};

type PaginatorActionRegistry = {
  register: (handlers: PaginatorActionHandlers) => () => void;
  run: (
    action:
      | {
          action: "paginator_next" | "paginator_prev" | "paginator_go_to";
          page?: number;
        }
      | null,
  ) => boolean;
};

export const SnapPaginatorActionContext =
  createContext<PaginatorActionRegistry | null>(null);

export function SnapPaginatorActionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const handlersRef = useRef<PaginatorActionHandlers | null>(null);

  const register = useCallback((handlers: PaginatorActionHandlers) => {
    handlersRef.current = handlers;
    return () => {
      if (handlersRef.current === handlers) handlersRef.current = null;
    };
  }, []);

  const run = useCallback<PaginatorActionRegistry["run"]>((action) => {
    const handlers = handlersRef.current;
    if (!handlers || !action) return false;
    if (action.action === "paginator_next") handlers.next();
    if (action.action === "paginator_prev") handlers.previous();
    if (action.action === "paginator_go_to") handlers.goTo(action.page ?? 0);
    return true;
  }, []);

  const value = useMemo(() => ({ register, run }), [register, run]);

  return (
    <SnapPaginatorActionContext.Provider value={value}>
      {children}
    </SnapPaginatorActionContext.Provider>
  );
}

export function useSnapPaginatorActions() {
  return useContext(SnapPaginatorActionContext);
}

export function getPaginatorAction(
  on: Record<string, unknown> | undefined,
):
  | { action: "paginator_next" | "paginator_prev" | "paginator_go_to"; page?: number }
  | null {
  const press = on?.press as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return null;

  if (press.action === "paginator_next") return { action: "paginator_next" };
  if (press.action === "paginator_prev") {
    return { action: "paginator_prev" };
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
  actions: PaginatorActionRegistry | null,
  action:
    | { action: "paginator_next" | "paginator_prev" | "paginator_go_to"; page?: number }
    | null,
): boolean {
  return actions?.run(action) ?? false;
}
