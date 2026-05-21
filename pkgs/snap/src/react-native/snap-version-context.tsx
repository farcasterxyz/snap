import { createContext, useContext } from "react";
import type { SpecVersion } from "@farcaster/snap";

const SnapVersionContext = createContext<SpecVersion>("1.0");

export const SnapVersionProvider = SnapVersionContext.Provider;

export function useSnapVersion(): SpecVersion {
  return useContext(SnapVersionContext);
}
