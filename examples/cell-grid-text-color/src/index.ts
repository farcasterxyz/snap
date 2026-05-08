import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (): Promise<SnapHandlerResult> => ({
  version: "2.0",
  theme: { accent: "blue" },
  ui: {
    root: "page",
    elements: {
      page: {
        type: "stack",
        props: { gap: "md" },
        children: ["title", "default_label", "default_grid", "override_label", "override_grid"],
      },
      title: {
        type: "item",
        props: {
          title: "Cell textColor",
          description: "Default auto-contrast stays on unless a cell sets textColor.",
          media: { variant: "icon", name: "palette", color: "blue" },
        },
      },
      default_label: {
        type: "text",
        props: {
          content: "Default auto-contrast",
          size: "sm",
          color: "muted",
        },
      },
      default_grid: {
        type: "cell_grid",
        props: {
          cols: 4,
          rows: 1,
          gap: "sm",
          rowHeight: 40,
          cells: [
            { row: 0, col: 0, color: "#111827", content: "A" },
            { row: 0, col: 1, color: "#F9FAFB", content: "B" },
            { row: 0, col: 2, color: "red", content: "C" },
            { row: 0, col: 3, color: "amber", content: "D" },
          ],
        },
      },
      override_label: {
        type: "text",
        props: {
          content: "Explicit textColor overrides",
          size: "sm",
          color: "muted",
        },
      },
      override_grid: {
        type: "cell_grid",
        props: {
          cols: 4,
          rows: 1,
          gap: "sm",
          rowHeight: 40,
          cells: [
            { row: 0, col: 0, color: "#111827", textColor: "amber", content: "A" },
            { row: 0, col: 1, color: "#F9FAFB", textColor: "#2563EB", content: "B" },
            { row: 0, col: 2, color: "red", textColor: "#111827", content: "C" },
            { row: 0, col: 3, color: "amber", textColor: "purple", content: "D" },
          ],
        },
      },
    },
  },
}));

export default app;
