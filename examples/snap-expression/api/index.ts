import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// CEO Spectrum  ·  /ceo-spectrum
// ─────────────────────────────────────────────────────────────────────────────

const CEO_SEED = [182, 389, 178, 98] as const;
const CEO_BUCKETS = [
  { label: "Very peaceful", min: 0, max: 25 },
  { label: "Leaning peace", min: 25, max: 50 },
  { label: "Leaning war", min: 50, max: 75 },
  { label: "Full wartime", min: 75, max: 101 },
] as const;

const ceoVotes: number[] = [];

registerSnapHandler(
  app,
  async (ctx): Promise<SnapHandlerResult> => {
    if (ctx.action.type === "post") {
      const rawPos = ctx.action.inputs["position"];
      const position = typeof rawPos === "number" ? Math.round(rawPos) : null;

      if (position !== null) {
        ceoVotes.push(position);

        const bucketValues = CEO_BUCKETS.map(
          (b, i) =>
            CEO_SEED[i]! +
            ceoVotes.filter((v) => v >= b.min && v < b.max).length,
        );

        const total = 847 + ceoVotes.length;
        const peacetimeVotes = bucketValues[0]! + bucketValues[1]!;
        const peacePct = Math.round((peacetimeVotes / total) * 100);
        const posLabel =
          position <= 25
            ? "very peaceful"
            : position <= 50
            ? "leaning peaceful"
            : position <= 75
            ? "leaning wartime"
            : "full wartime";

        // Convert bar_chart to progress bars
        const maxBucket = Math.max(...bucketValues);

        return {
          version: "1.0",
          theme: { accent: "purple" },
          spec: {
            root: "page",
            elements: {
              page: {
                type: "stack",
                props: {},
                children: [
                  "title",
                  "bar-0",
                  "bar-1",
                  "bar-2",
                  "bar-3",
                  "summary",
                  "your-vote",
                  "btn-vote-again",
                ],
              },
              title: {
                type: "item",
                props: { title: "Community Results" },
              },
              "bar-0": {
                type: "progress",
                props: {
                  value: bucketValues[0]!,
                  max: maxBucket,
                  label: CEO_BUCKETS[0].label,
                },
              },
              "bar-1": {
                type: "progress",
                props: {
                  value: bucketValues[1]!,
                  max: maxBucket,
                  label: CEO_BUCKETS[1].label,
                },
              },
              "bar-2": {
                type: "progress",
                props: {
                  value: bucketValues[2]!,
                  max: maxBucket,
                  label: CEO_BUCKETS[2].label,
                },
              },
              "bar-3": {
                type: "progress",
                props: {
                  value: bucketValues[3]!,
                  max: maxBucket,
                  label: CEO_BUCKETS[3].label,
                },
              },
              summary: {
                type: "item",
                props: {
                  description: `${peacePct}% lean peacetime · ${
                    100 - peacePct
                  }% lean wartime · ${total} votes`,
                },
              },
              "your-vote": {
                type: "badge",
                props: {
                  content: `You placed yourself: ${posLabel} (${position}/100)`,
                },
              },
              "btn-vote-again": {
                type: "button",
                props: { label: "Vote again" },
                on: {
                  press: {
                    action: "submit",
                    params: { target: `${snapBaseUrl()}/ceo-spectrum` },
                  },
                },
              },
            },
          },
        };
      }
    }

    return {
      version: "1.0",
      theme: { accent: "purple" },
      spec: {
        root: "page",
        elements: {
          page: {
            type: "stack",
            props: {},
            children: ["title", "body", "slider", "btn-vote"],
          },
          title: {
            type: "item",
            props: { title: "Where do you fall on the spectrum?" },
          },
          body: {
            type: "item",
            props: {
              description:
                "peacetime CEO = abundance mindset · wartime CEO = scarcity mindset",
            },
          },
          slider: {
            type: "slider",
            props: {
              name: "position",
              min: 0,
              max: 100,
              step: 5,
              value: 50,
              minLabel: "Peacetime",
              maxLabel: "Wartime",
            },
          },
          "btn-vote": {
            type: "button",
            props: { label: "Vote" },
            on: {
              press: {
                action: "submit",
                params: { target: `${snapBaseUrl()}/ceo-spectrum` },
              },
            },
          },
        },
      },
    };
  },
  {
    path: "/ceo-spectrum",
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// VCX Explorer  ·  /vcx-explorer
// ─────────────────────────────────────────────────────────────────────────────

const NAV_PER_SHARE = 19;
const CURRENT_PRICE = 312;
const PREMIUM = CURRENT_PRICE / NAV_PER_SHARE;

const HOLDINGS = [
  { label: "Anthropic", value: 21 },
  { label: "Databricks", value: 18 },
  { label: "OpenAI", value: 10 },
  { label: "Anduril", value: 7 },
  { label: "SpaceX", value: 5 },
  { label: "Other", value: 39 },
] as const;

registerSnapHandler(
  app,
  async (ctx): Promise<SnapHandlerResult> => {
    if (ctx.action.type === "post") {
      const rawAmount = ctx.action.inputs["amount"];
      const amountStr =
        typeof rawAmount === "string" ? rawAmount.replace(/[$,\s]/g, "") : "";
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0) {
        const currentValue = amount * PREMIUM;
        const returnPct = Math.round((PREMIUM - 1) * 100);
        const body = `$${fmtNum(amount)} invested at NAV → $${fmtNum(
          currentValue,
        )} today (+${returnPct.toLocaleString()}%)`;

        // Convert bar_chart (holdings) to progress bars
        const holdingIds = HOLDINGS.map((_, i) => `holding-${i}`);

        const elements: Record<string, unknown> = {
          page: {
            type: "stack",
            props: {},
            children: [
              "title",
              "result-body",
              ...holdingIds,
              "caption",
              "btn-try-again",
            ],
          },
          title: {
            type: "item",
            props: { title: "$VCX Return Calculator" },
          },
          "result-body": {
            type: "item",
            props: { description: body },
          },
          caption: {
            type: "badge",
            props: {
              content: `$650M fund at $5.4B market cap — investors paying ${PREMIUM.toFixed(
                1,
              )}x NAV for pre-IPO access`,
            },
          },
          "btn-try-again": {
            type: "button",
            props: { label: "Try another amount" },
            on: {
              press: {
                action: "submit",
                params: { target: `${snapBaseUrl()}/vcx-explorer` },
              },
            },
          },
        };

        for (let i = 0; i < HOLDINGS.length; i++) {
          const h = HOLDINGS[i]!;
          elements[`holding-${i}`] = {
            type: "progress",
            props: { value: h.value, max: 100, label: `${h.label} (${h.value}%)` },
          };
        }

        return {
          version: "1.0",
          theme: { accent: "green" },
          spec: {
            root: "page",
            elements: elements as any,
          },
        };
      }
    }

    return {
      version: "1.0",
      theme: { accent: "green" },
      spec: {
        root: "page",
        elements: {
          page: {
            type: "stack",
            props: {},
            children: [
              "title",
              "nav-info",
              "holding-anthropic",
              "holding-databricks",
              "holding-openai",
              "holding-others",
              "amount-input",
              "btn-calculate",
            ],
          },
          title: {
            type: "item",
            props: { title: "$VCX Fund Explorer" },
          },
          "nav-info": {
            type: "item",
            props: {
              description: `NAV $${NAV_PER_SHARE} · Market $${CURRENT_PRICE} · ${PREMIUM.toFixed(
                1,
              )}x premium`,
            },
          },
          "holding-anthropic": {
            type: "item",
            props: { title: "Anthropic", description: "21%" },
          },
          "holding-databricks": {
            type: "item",
            props: { title: "Databricks", description: "18%" },
          },
          "holding-openai": {
            type: "item",
            props: { title: "OpenAI", description: "10%" },
          },
          "holding-others": {
            type: "item",
            props: {
              title: "Anduril, SpaceX & others",
              description: "51%",
            },
          },
          "amount-input": {
            type: "input",
            props: { name: "amount", placeholder: "Investment at NAV ($)" },
          },
          "btn-calculate": {
            type: "button",
            props: { label: "Calculate Return" },
            on: {
              press: {
                action: "submit",
                params: { target: `${snapBaseUrl()}/vcx-explorer` },
              },
            },
          },
        },
      },
    };
  },
  {
    path: "/vcx-explorer",
  },
);

export default app;
export const runtime = "edge";
export const GET = handle(app);
export const POST = handle(app);

function snapBaseUrl(): string {
  const raw =
    process.env.SNAP_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? "3013"}`;
  return raw.replace(/\/$/, "");
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
