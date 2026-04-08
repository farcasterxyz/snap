"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_VERSION } from "@/lib/version-config";
import { parseVersionFromPathname } from "./VersionDropdown";

const VersionContext = createContext<string>(DEFAULT_VERSION);

export function useVersion(): string {
  return useContext(VersionContext);
}

export function VersionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { version } = parseVersionFromPathname(pathname);

  return (
    <VersionContext.Provider value={version}>
      {children}
    </VersionContext.Provider>
  );
}
