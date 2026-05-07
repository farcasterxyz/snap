import { createContext, useContext } from "react";

const SnapItemGroupBorderContext = createContext(false);

export const SnapItemGroupBorderProvider =
  SnapItemGroupBorderContext.Provider;

export function useSnapItemGroupHasBorder() {
  return useContext(SnapItemGroupBorderContext);
}
