"use client";

import type { ReactNode } from "react";
import {
  createRenderer,
  useStateStore,
  useStateValue,
} from "@json-render/react";
import {
  POST_GRID_TAP_KEY,
  PALETTE_LIGHT_HEX,
  type PaletteColor,
} from "@farcaster/snap";
import { snapJsonRenderCatalog } from "@farcaster/snap-ui-elements";

/** Resolve a palette color name to its light-mode hex value. */
function paletteHex(name: string): string {
  return PALETTE_LIGHT_HEX[name as PaletteColor] ?? PALETTE_LIGHT_HEX.purple;
}

function useAccent(): string {
  const accent = useStateValue<string>("/theme/accent");
  return paletteHex(accent ?? "purple");
}

export const SnapCatalogView = createRenderer(snapJsonRenderCatalog, {
  Stack: ({ children }) => (
    <div
      style={{
        display: "grid",
        gap: 12,
        width: "100%",
      }}
    >
      {children}
    </div>
  ),

  Text: ({ element: { props } }) => {
    const style = String(props.style ?? "body");
    const content = String(props.content ?? "");
    const align = (props.align as string | undefined) ?? "left";
    const fontSize =
      style === "title"
        ? 22
        : style === "label"
        ? 13
        : style === "caption"
        ? 12
        : 16;
    const fontWeight = style === "title" || style === "label" ? 700 : 400;
    const color = style === "caption" ? "var(--text-muted)" : "var(--text-primary)";
    return (
      <p
        style={{
          margin: 0,
          fontSize,
          fontWeight,
          color,
          textAlign: align as "left" | "center" | "right",
        }}
      >
        {content}
      </p>
    );
  },

  Image: ({ element: { props } }) => {
    const url = String(props.url ?? "");
    const alt = String(props.alt ?? "");
    return (
      <img
        src={url}
        alt={alt}
        style={{ width: "100%", borderRadius: 10, display: "block" }}
      />
    );
  },

  Video: ({ element: { props } }) => {
    const url = String(props.url ?? "");
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: "100%", borderRadius: 10, display: "block" }}
      />
    );
  },

  Divider: () => (
    <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
  ),

  Spacer: ({ element: { props } }) => {
    const size = String(props.size ?? "medium");
    const height = size === "small" ? 6 : size === "large" ? 20 : 12;
    return <div style={{ height }} />;
  },

  Progress: ({ element: { props } }) => {
    const accent = useAccent();
    const value = Number(props.value ?? 0);
    const max = Math.max(1, Number(props.max ?? 100));
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const semantic = String(props.color ?? "accent");
    const hasSemantic = Object.prototype.hasOwnProperty.call(
      PALETTE_LIGHT_HEX,
      semantic as PaletteColor,
    );
    const fill =
      semantic === "accent" || !hasSemantic ? accent : paletteHex(semantic);
    return (
      <div style={{ width: "100%" }}>
        {props.label != null ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            {String(props.label)}
          </div>
        ) : null}
        <div
          style={{
            height: 8,
            width: "100%",
            borderRadius: 999,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{ height: "100%", width: `${percent}%`, background: fill }}
          />
        </div>
      </div>
    );
  },

  List: ({ element: { props } }) => {
    const style = String(props.style ?? "ordered");
    const items = Array.isArray(props.items) ? props.items : [];
    const Wrapper = style === "unordered" ? "ul" : "ol";
    return (
      <Wrapper
        style={{
          margin: 0,
          paddingLeft: 20,
          fontSize: 14,
          color: "var(--text-primary)",
        }}
      >
        {items.map(
          (item: { content?: string; trailing?: string }, i: number) => (
            <li
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "baseline",
              }}
            >
              <span>{String(item.content ?? "")}</span>
              {item.trailing != null ? (
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {String(item.trailing)}
                </span>
              ) : null}
            </li>
          ),
        )}
      </Wrapper>
    );
  },

  Grid: ({ element: { props } }) => {
    const accent = useAccent();
    const { get, set } = useStateStore();
    const cols = Number(props.cols ?? 2);
    const rows = Number(props.rows ?? 2);
    const interactive = props.interactive === true;
    const cells = Array.isArray(props.cells) ? props.cells : [];
    const tapPath = `/inputs/${POST_GRID_TAP_KEY}`;
    const tapRaw = get(tapPath);
    const tapCoord =
      tapRaw && typeof tapRaw === "object" && "row" in tapRaw && "col" in tapRaw
        ? {
            row: Number((tapRaw as { row: unknown }).row),
            col: Number((tapRaw as { col: unknown }).col),
          }
        : null;
    const cellMap = new Map<string, { color?: string; content?: string }>();
    for (const c of cells) {
      const row = Number(c.row);
      const col = Number(c.col);
      cellMap.set(`${row},${col}`, {
        color: c.color as string | undefined,
        content: c.content != null ? String(c.content) : undefined,
      });
    }
    const cellsEls: ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cellMap.get(`${r},${c}`);
        const selected =
          interactive &&
          tapCoord != null &&
          tapCoord.row === r &&
          tapCoord.col === c;
        const onPick = interactive
          ? () => set(tapPath, { row: r, col: c })
          : undefined;
        cellsEls.push(
          <div
            key={`${r}-${c}`}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={onPick}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      set(tapPath, { row: r, col: c });
                    }
                  }
                : undefined
            }
            style={{
              background: cell?.color ?? "transparent",
              border: selected ? `2px solid ${accent}` : "1px solid var(--border)",
              borderRadius: 4,
              minHeight: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              cursor: interactive ? "pointer" : "default",
              userSelect: interactive ? "none" : undefined,
            }}
          >
            {cell?.content ?? ""}
          </div>,
        );
      }
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 4,
        }}
      >
        {cellsEls}
      </div>
    );
  },

  TextInput: ({ element: { props } }) => {
    const { get, set } = useStateStore();
    const name = String(props.name ?? "input");
    const path = `/inputs/${name}`;
    const value = String(get(path) ?? "");
    const placeholder =
      props.placeholder != null ? String(props.placeholder) : "";
    return (
      <input
        value={value}
        onChange={(e) => set(path, e.target.value)}
        placeholder={placeholder}
        maxLength={
          props.maxLength != null ? Number(props.maxLength) : undefined
        }
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid var(--input-border)",
          borderRadius: 10,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    );
  },

  Slider: ({ element: { props } }) => {
    const accent = useAccent();
    const { get, set } = useStateStore();
    const name = String(props.name ?? "slider");
    const path = `/inputs/${name}`;
    const min = Number(props.min ?? 0);
    const max = Number(props.max ?? 100);
    const step = props.step != null ? Number(props.step) : 1;
    const fallback =
      props.value != null ? Number(props.value) : (min + max) / 2;
    const raw = get(path);
    const value = raw === undefined || raw === null ? fallback : Number(raw);
    return (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(path, Number(e.target.value))}
        style={{ width: "100%", accentColor: accent }}
      />
    );
  },

  Toggle: ({ element: { props } }) => {
    const { get, set } = useStateStore();
    const name = String(props.name ?? "toggle");
    const path = `/inputs/${name}`;
    const label = String(props.label ?? name);
    const fallback = Boolean(props.value ?? false);
    const raw = get(path);
    const checked = raw === undefined || raw === null ? fallback : Boolean(raw);
    return (
      <label
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span>{label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => set(path, e.target.checked)}
        />
      </label>
    );
  },

  ButtonGroup: ({ element: { props } }) => {
    const accent = useAccent();
    const { get, set } = useStateStore();
    const name = String(props.name ?? "choice");
    const path = `/inputs/${name}`;
    const options = Array.isArray(props.options) ? props.options : [];
    const selected = String(get(path) ?? "");
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {options.map((opt: string, index: number) => {
          const label = String(opt);
          const isSelected = label === selected;
          return (
            <button
              type="button"
              key={index}
              onClick={() => set(path, label)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${isSelected ? accent : "var(--input-border)"}`,
                background: isSelected ? `${accent}20` : "var(--input-bg)",
                color: isSelected ? accent : "var(--text-primary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  },

  BarChart: ({ element: { props } }) => {
    const accent = useAccent();
    const bars = Array.isArray(props.bars) ? props.bars : [];
    const chartColor = String(props.color ?? "accent");
    const defaultFill =
      chartColor === "accent" ? accent : paletteHex(chartColor);
    const maxVal =
      props.max != null
        ? Number(props.max)
        : Math.max(
            ...bars.map((b: { value?: number }) => Number(b.value ?? 0)),
            1,
          );
    const barHeight = 120;
    return (
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: bars.length > 4 ? 4 : 8,
            height: barHeight,
            width: "100%",
            borderBottom: "1px solid var(--border)",
            paddingBottom: 1,
          }}
        >
          {bars.map(
            (
              bar: { label?: string; value?: number; color?: string },
              i: number,
            ) => {
              const value = Number(bar.value ?? 0);
              const pct =
                maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
              const fill =
                bar.color && bar.color in PALETTE_LIGHT_HEX
                  ? paletteHex(bar.color)
                  : defaultFill;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 3,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 48,
                      height: `${pct}%`,
                      minHeight: pct > 0 ? 4 : 0,
                      background: fill,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.5s ease-out",
                    }}
                  />
                </div>
              );
            },
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: bars.length > 4 ? 4 : 8,
            marginTop: 6,
          }}
        >
          {bars.map((bar: { label?: string }, i: number) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {String(bar.label ?? "")}
            </div>
          ))}
        </div>
      </div>
    );
  },

  Group: ({ children }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "stretch",
        width: "100%",
      }}
    >
      {children}
    </div>
  ),

  ActionButton: ({ element: { props }, emit, children }) => {
    const accent = useAccent();
    const label = String(props.label ?? "Action");
    const styleType = props.style === "secondary" ? "secondary" : "primary";
    return (
      <>
        <button
          type="button"
          onClick={() => emit("press")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: styleType === "primary" ? "none" : `1px solid ${accent}`,
            background: styleType === "primary" ? accent : "var(--input-bg)",
            color: styleType === "primary" ? "#ffffff" : accent,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {label}
        </button>
        {children != null ? (
          <div style={{ display: "grid", gap: 8, width: "100%" }}>
            {children}
          </div>
        ) : null}
      </>
    );
  },
});
