import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapElementInput, SnapHandlerResult } from "@farcaster/snap";

type View =
  | "buttons-2"
  | "buttons-3"
  | "buttons-4"
  | "buttons-5"
  | "buttons-6"
  | "toggles-2"
  | "toggles-3"
  | "toggles-4"
  | "toggles-5"
  | "toggles-6";

type CaseConfig = {
  id: string;
  title: string;
  labels: string[];
  expected: "horizontal" | "vertical";
  sent: "horizontal" | "vertical";
  equalWidth?: boolean;
};

const VIEWS: View[] = [
  "buttons-2",
  "buttons-3",
  "buttons-4",
  "buttons-5",
  "buttons-6",
  "toggles-2",
  "toggles-3",
  "toggles-4",
  "toggles-5",
  "toggles-6",
];

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  const url = new URL(ctx.request.url);
  const view = parseView(url.searchParams.get("view"));
  return pageForView(snapBaseUrl(ctx.request), view);
});

export default app;

function pageForView(base: string, view: View): SnapHandlerResult {
  const isTogglePage = view.startsWith("toggles");
  const cases = casesForView(view);
  const elements: Record<string, SnapElementInput> = {
    page: {
      type: "stack",
      props: {},
      children: ["title", ...cases.map((item) => `group-${item.id}`), "nav"],
    },
    title: {
      type: "item",
      props: {
        title: isTogglePage
          ? `Toggle group orientation: ${controlCount(view)} controls`
          : `Button stack orientation: ${controlCount(view)} controls`,
        description:
          "Rows: 2 controls <=20 chars, 3 <=15, 4 <=11, 5 <=8. Over the cap, or 6 controls, should stack vertically.",
      },
    },
    nav: navStack(view),
  };

  for (const item of cases) {
    elements[`group-${item.id}`] = caseGroup(item, isTogglePage);
    elements[`label-${item.id}`] = {
      type: "item",
      props: {
        title: item.title,
        description: [
          `Expected ${item.expected}; snap sends ${item.sent}.`,
          `Total chars: ${totalChars(item.labels)}.`,
          item.equalWidth ? "Stack sets equalWidth: true." : undefined,
        ].filter(Boolean).join(" "),
      },
    };
    if (isTogglePage) {
      elements[`control-${item.id}`] = {
        type: "toggle_group",
        props: {
          name: `toggle_${item.id}`,
          orientation: item.sent,
          options: item.labels,
        },
      };
    } else {
      elements[`control-${item.id}`] = {
        type: "stack",
        props: {
          direction: item.sent,
          ...(item.equalWidth ? { equalWidth: true } : {}),
        },
        children: item.labels.map((_, index) => `button-${item.id}-${index}`),
      };
      item.labels.forEach((label, index) => {
        elements[`button-${item.id}-${index}`] = {
          type: "button",
          props: { label },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=${view}` },
            },
          },
        };
      });
    }
  }

  for (const navView of VIEWS) {
    elements[`nav-${navView}`] = navButton(base, navView);
  }

  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements,
    },
  };
}

function casesForView(view: View): CaseConfig[] {
  switch (view) {
    case "buttons-2":
      return [
        {
          id: "b2-pass",
          title: "2 buttons at max cap",
          labels: ["A", "Long label text now"],
          expected: "horizontal",
          sent: "horizontal",
          equalWidth: true,
        },
        {
          id: "b2-fail",
          title: "2 buttons one char over cap",
          labels: ["ABCDEFGHIJ", "ABCDEFGHIJK"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "buttons-3":
      return [
        {
          id: "b3-pass",
          title: "3 buttons at max cap",
          labels: ["A", "Medium", "Long one"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "b3-fail",
          title: "3 buttons one char over cap",
          labels: ["ABCDE", "FGHIJ", "KLMNOP"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "buttons-4":
      return [
        {
          id: "b4-pass",
          title: "4 buttons at max cap",
          labels: ["A", "Mid", "Wide", "Big"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "b4-fail",
          title: "4 buttons one char over cap",
          labels: ["ABC", "DEF", "GHI", "JKL"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "buttons-5":
      return [
        {
          id: "b5-pass",
          title: "5 buttons at max cap",
          labels: ["A", "B", "Md", "Big", "X"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "b5-fail",
          title: "5 buttons one char over cap",
          labels: ["A", "B", "C", "D", "EFGHI"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "buttons-6":
      return [
        {
          id: "b6-fail",
          title: "6 buttons always vertical",
          labels: ["A", "B", "C", "D", "E", "F"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "toggles-2":
      return [
        {
          id: "t2-pass",
          title: "2 toggles at max cap",
          labels: ["A", "Long label text now"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "t2-fail",
          title: "2 toggles one char over cap",
          labels: ["ABCDEFGHIJ", "ABCDEFGHIJK"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "toggles-3":
      return [
        {
          id: "t3-pass",
          title: "3 toggles at max cap",
          labels: ["A", "Medium", "Long one"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "t3-fail",
          title: "3 toggles one char over cap",
          labels: ["ABCDE", "FGHIJ", "KLMNOP"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "toggles-4":
      return [
        {
          id: "t4-pass",
          title: "4 toggles at max cap",
          labels: ["A", "Mid", "Wide", "Big"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "t4-fail",
          title: "4 toggles one char over cap",
          labels: ["ABC", "DEF", "GHI", "JKL"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "toggles-5":
      return [
        {
          id: "t5-pass",
          title: "5 toggles at max cap",
          labels: ["A", "B", "Md", "Big", "X"],
          expected: "horizontal",
          sent: "vertical",
        },
        {
          id: "t5-fail",
          title: "5 toggles one char over cap",
          labels: ["A", "B", "C", "D", "EFGHI"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
    case "toggles-6":
      return [
        {
          id: "t6-fail",
          title: "6 toggles always vertical",
          labels: ["A", "B", "C", "D", "E", "F"],
          expected: "vertical",
          sent: "horizontal",
        },
      ];
  }
}

function caseGroup(item: CaseConfig, isTogglePage: boolean): SnapElementInput {
  return {
    type: "stack",
    props: { gap: "sm" },
    children: [`label-${item.id}`, `control-${item.id}`],
  };
}

function navStack(view: View): SnapElementInput {
  const index = VIEWS.indexOf(view);
  const children: string[] = [];
  if (index > 0) children.push(`nav-${VIEWS[index - 1]}`);
  if (index < VIEWS.length - 1) children.push(`nav-${VIEWS[index + 1]}`);
  return {
    type: "stack",
    props: { direction: "horizontal" },
    children,
  };
}

function navButton(base: string, view: View): SnapElementInput {
  return {
    type: "button",
    props: { label: navLabel(view) },
    on: {
      press: {
        action: "submit",
        params: { target: `${base}/?view=${view}` },
      },
    },
  };
}

function navLabel(view: View): string {
  return view.replace("-", " ");
}

function parseView(raw: string | null): View {
  return raw && VIEWS.includes(raw as View) ? (raw as View) : "buttons-2";
}

function controlCount(view: View): string {
  return view.split("-")[1] ?? "";
}

function totalChars(labels: string[]): number {
  return labels.reduce(
    (sum, label) => sum + Array.from(label.trim().replace(/\s+/g, " ")).length,
    0,
  );
}

function snapBaseUrl(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "http";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3021"}`.replace(/\/$/, "");
}
