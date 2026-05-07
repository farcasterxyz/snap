import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  const base = snapBaseUrlFromRequest(ctx.request);
  const pressed =
    ctx.action.type === "post" && typeof ctx.action.inputs.mine === "string"
      ? ctx.action.inputs.mine
      : null;

  return boardPage(base, pressed);
});

export default app;

function boardPage(base: string, pressed: string | null): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { gap: "sm" },
          children: ["title", "hint", "board", "pressed"],
        },
        title: {
          type: "item",
          props: {
            title: "Square cell grid",
            description: "A 9x9 board using cellAspectRatio: square.",
            media: { variant: "icon", name: "grid-3x3", color: "green" },
          },
          children: ["badge"],
        },
        badge: {
          type: "badge",
          props: { label: "2.0", color: "green" },
        },
        hint: {
          type: "text",
          props: {
            content: "Cells should remain square as the emulator width changes.",
            size: "sm",
            color: "muted",
          },
        },
        board: {
          type: "cell_grid",
          props: {
            name: "mine",
            cols: 9,
            rows: 9,
            gap: "sm",
            cellAspectRatio: "square",
            cells: mineCells(),
          },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
        pressed: {
          type: "text",
          props: {
            content: pressed ? `Last press: ${pressed}` : "Press a cell to submit coordinates.",
            size: "sm",
            align: "center",
          },
        },
      },
    },
  };
}

function mineCells(): Array<{
  row: number;
  col: number;
  color?: string;
  content?: string;
}> {
  const mines = new Set(["0,1", "1,3", "2,7", "4,4", "6,2", "7,6", "8,0"]);
  const numbers = new Map<string, string>([
    ["0,0", "1"],
    ["0,2", "1"],
    ["1,1", "1"],
    ["1,2", "1"],
    ["2,3", "1"],
    ["3,4", "1"],
    ["4,3", "1"],
    ["4,5", "1"],
    ["5,2", "1"],
    ["6,6", "1"],
    ["7,0", "1"],
  ]);

  const cells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const key = `${row},${col}`;
      const isMine = mines.has(key);
      const content = isMine ? "*" : numbers.get(key);
      cells.push({
        row,
        col,
        color: isMine ? "#ef4444" : (row + col) % 2 === 0 ? "#d1fae5" : "#a7f3d0",
        ...(content ? { content } : {}),
      });
    }
  }
  return cells;
}

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3022"}`.replace(/\/$/, "");
}
