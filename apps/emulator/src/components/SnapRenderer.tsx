"use client";

import { useColorMode } from "@neynar/ui/color-mode";
import {
  SnapView,
  type SnapPage,
  type SnapActionHandlers,
} from "@farcaster/snap/react";

export type { SnapPage, SnapActionHandlers };

export function SnapRenderer({
  snap,
  handlers,
  loading,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading: boolean;
}) {
  const { mode } = useColorMode();
  return (
    <SnapView
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={mode}
    />
  );
}
