import { SnapFunction } from "./schemas";

export type Middleware = (fn: SnapFunction) => SnapFunction;

export function useMiddleware(fn: SnapFunction, middleware: Middleware[]) {
  return middleware.reduce((acc, middleware) => middleware(acc), fn);
}
