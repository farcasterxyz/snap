"use client";

import { SnapViewCore } from "../snap-view-core";
import type { SnapPage, SnapActionHandlers } from "../index";

export function SnapViewV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
}) {
  return (
    <SnapViewCore
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={appearance}
    />
  );
}

export function SnapCardV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  maxWidth = 480,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
}) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth }}>
      <SnapViewV1
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
      />
    </div>
  );
}
