"use client";

import type { Spec } from "@json-render/core";

export type SpecViewerProps = {
  spec: Spec | null;
};

export function SpecViewer({ spec }: SpecViewerProps) {
  if (!spec) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        Load a snap to see its spec
      </div>
    );
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 16,
        fontSize: 11,
        lineHeight: 1.5,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "auto",
        height: "100%",
        boxSizing: "border-box",
        background: "var(--bg-hover)",
        color: "var(--text-primary)",
        borderRadius: 0,
      }}
    >
      {JSON.stringify(spec, null, 2)}
    </pre>
  );
}
