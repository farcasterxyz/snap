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
  actionError,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  actionError?: string | null;
}) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth }}>
      <SnapViewV1
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
      />
      {actionError && (
        <div
          style={{
            padding: "8px 12px",
            fontSize: 13,
            color:
              appearance === "dark"
                ? "rgba(255,100,100,0.9)"
                : "rgba(200,0,0,0.8)",
          }}
        >
          {actionError}
        </div>
      )}
    </div>
  );
}
