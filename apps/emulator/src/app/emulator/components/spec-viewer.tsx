"use client";

import { useState, useCallback, type ReactNode } from "react";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const COLORS = {
  key: "var(--text-secondary)",
  string: "#22c55e",
  number: "#3b82f6",
  boolean: "#f59e0b",
  null: "#6b7280",
  brace: "var(--text-secondary)",
  comma: "var(--text-secondary)",
};

const FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

function JsonString({ value }: { value: string }) {
  const display = value.length > 80 ? value.slice(0, 77) + "..." : value;
  return <span style={{ color: COLORS.string }}>&quot;{display}&quot;</span>;
}

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null) return <span style={{ color: COLORS.null }}>null</span>;
  if (typeof value === "boolean")
    return <span style={{ color: COLORS.boolean }}>{String(value)}</span>;
  if (typeof value === "number")
    return <span style={{ color: COLORS.number }}>{String(value)}</span>;
  if (typeof value === "string") return <JsonString value={value} />;
  return <span>{String(value)}</span>;
}

function JsonNode({
  keyName,
  value,
  indent,
  last,
  defaultOpen = false,
}: {
  keyName?: string;
  value: unknown;
  indent: number;
  last: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pad = indent * 14;
  const comma = last ? "" : ",";

  if (value === null || typeof value !== "object") {
    return (
      <div style={{ paddingLeft: pad }}>
        {keyName !== undefined && (
          <>
            <span style={{ color: COLORS.key }}>&quot;{keyName}&quot;</span>
            <span style={{ color: COLORS.comma }}>: </span>
          </>
        )}
        <JsonPrimitive value={value} />
        <span style={{ color: COLORS.comma }}>{comma}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as JsonValue[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, JsonValue>);
  const openBrace = isArray ? "[" : "{";
  const closeBrace = isArray ? "]" : "}";
  const count = entries.length;

  if (count === 0) {
    return (
      <div style={{ paddingLeft: pad }}>
        {keyName !== undefined && (
          <>
            <span style={{ color: COLORS.key }}>&quot;{keyName}&quot;</span>
            <span style={{ color: COLORS.comma }}>: </span>
          </>
        )}
        <span style={{ color: COLORS.brace }}>
          {openBrace}
          {closeBrace}
        </span>
        <span style={{ color: COLORS.comma }}>{comma}</span>
      </div>
    );
  }

  const toggle = useCallback(() => setOpen((p) => !p), []);

  return (
    <>
      <div
        style={{ paddingLeft: pad, cursor: "pointer", userSelect: "none" }}
        onClick={toggle}
      >
        <span
          style={{
            display: "inline-block",
            width: 12,
            fontSize: 9,
            color: COLORS.brace,
            textAlign: "center",
          }}
        >
          {open ? "▼" : "▶"}
        </span>
        {keyName !== undefined && (
          <>
            <span style={{ color: COLORS.key }}>&quot;{keyName}&quot;</span>
            <span style={{ color: COLORS.comma }}>: </span>
          </>
        )}
        <span style={{ color: COLORS.brace }}>{openBrace}</span>
        {!open && (
          <>
            <span style={{ color: COLORS.null }}> {count} {isArray ? "items" : "keys"} </span>
            <span style={{ color: COLORS.brace }}>{closeBrace}</span>
            <span style={{ color: COLORS.comma }}>{comma}</span>
          </>
        )}
      </div>
      {open && (
        <>
          {entries.map(([k, v], i) => (
            <JsonNode
              key={k}
              keyName={isArray ? undefined : k}
              value={v}
              indent={indent + 1}
              last={i === count - 1}
              defaultOpen={indent < 1}
            />
          ))}
          <div style={{ paddingLeft: pad }}>
            <span style={{ display: "inline-block", width: 12 }} />
            <span style={{ color: COLORS.brace }}>{closeBrace}</span>
            <span style={{ color: COLORS.comma }}>{comma}</span>
          </div>
        </>
      )}
    </>
  );
}

export type SpecViewerProps = {
  data: Record<string, unknown> | null;
};

export function SpecViewer({ data }: SpecViewerProps) {
  if (!data) {
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
        Load a snap to see the response
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 8px",
        fontSize: 12,
        lineHeight: 1.6,
        fontFamily: FONT,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <JsonNode value={data} indent={0} last defaultOpen />
    </div>
  );
}
