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
  plain = false,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  actionError?: string | null;
  plain?: boolean;
}) {
  const isDark = appearance === "dark";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth,
        overflow: "hidden",
        ...(plain ? {} : {
          borderRadius: 16,
          border: `1px solid ${borderColor}`,
          backgroundColor: surfaceBg,
        }),
      }}
    >
      <div style={plain ? undefined : { padding: 16 }}>
      <SnapViewV1
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
      />
      </div>
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
