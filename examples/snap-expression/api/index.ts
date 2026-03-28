import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapResponse } from "@farcaster/snap";

const app = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// CEO Spectrum  ·  /ceo-spectrum
//
// Cast: "peacetime CEO = abundance mindset / wartime CEO = scarcity mindset / discuss"
// The snap turns the cast's open question into a live community vote.
// ─────────────────────────────────────────────────────────────────────────────

// Seeded distribution: 847 votes spread across four buckets (0–25, 25–50, 50–75, 75–100)
const CEO_SEED = [182, 389, 178, 98] as const;
/** Bar chart colors must use the snap theme palette (not raw hex). */
const CEO_BUCKET_COLORS = ["blue", "purple", "amber", "red"] as const;
const CEO_BUCKETS = [
  { label: "Very peaceful", min: 0, max: 25 },
  { label: "Leaning peace", min: 25, max: 50 },
  { label: "Leaning war", min: 50, max: 75 },
  { label: "Full wartime", min: 75, max: 101 },
] as const;

const ceoVotes: number[] = [];

registerSnapHandler(
  app,
  async ({ action }): Promise<SnapResponse> => {
    if (action.type === "post") {
      const rawPos = action.inputs["position"];
      const position = typeof rawPos === "number" ? Math.round(rawPos) : null;

      if (position !== null) {
        ceoVotes.push(position);

        const bars = CEO_BUCKETS.map((b, i) => ({
          label: b.label,
          value:
            CEO_SEED[i]! +
            ceoVotes.filter((v) => v >= b.min && v < b.max).length,
          color: CEO_BUCKET_COLORS[i]!,
        }));

        const total = 847 + ceoVotes.length;
        const peacetimeVotes = bars[0]!.value + bars[1]!.value;
        const peacePct = Math.round((peacetimeVotes / total) * 100);
        const posLabel =
          position <= 25
            ? "very peaceful"
            : position <= 50
            ? "leaning peaceful"
            : position <= 75
            ? "leaning wartime"
            : "full wartime";

        return {
          version: "1.0",
          page: {
            theme: { accent: "purple" },
            button_layout: "stack",
            elements: {
              type: "stack",
              children: [
                { type: "text", style: "title", content: "Community Results" },
                { type: "bar_chart", bars },
                {
                  type: "text",
                  style: "body",
                  content: `${peacePct}% lean peacetime · ${
                    100 - peacePct
                  }% lean wartime · ${total} votes`,
                },
                {
                  type: "text",
                  style: "caption",
                  content: `You placed yourself: ${posLabel} (${position}/100)`,
                },
              ],
            },
            buttons: [
              {
                label: "Vote again",
                action: "post",
                target: `${snapBaseUrl()}/ceo-spectrum`,
              },
            ],
          },
        };
      }
    }

    return {
      version: "1.0",
      page: {
        theme: { accent: "purple" },
        button_layout: "stack",
        elements: {
          type: "stack",
          children: [
            {
              type: "text",
              style: "title",
              content: "Where do you fall on the spectrum?",
            },
            {
              type: "text",
              style: "body",
              content:
                "peacetime CEO = abundance mindset · wartime CEO = scarcity mindset",
            },
            {
              type: "slider",
              name: "position",
              min: 0,
              max: 100,
              step: 5,
              value: 50,
              minLabel: "Peacetime",
              maxLabel: "Wartime",
            },
          ],
        },
        buttons: [
          {
            label: "Vote",
            action: "post",
            target: `${snapBaseUrl()}/ceo-spectrum`,
          },
        ],
      },
    };
  },
  {
    path: "/ceo-spectrum",
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// VCX Explorer  ·  /vcx-explorer
//
// Cast: "The Anthropic mini IPO is unfolding and you already missed a 15x return
// The stock is named VCX by Fundrise and just went up 1,500% in 5 days..."
// The snap turns the data-heavy cast into an interactive fund explorer + return calc.
// ─────────────────────────────────────────────────────────────────────────────

const NAV_PER_SHARE = 19;
const CURRENT_PRICE = 312;
const PREMIUM = CURRENT_PRICE / NAV_PER_SHARE;

const HOLDINGS = [
  { label: "Anthropic", value: 21, color: "purple" },
  { label: "Databricks", value: 18, color: "blue" },
  { label: "OpenAI", value: 10, color: "green" },
  { label: "Anduril", value: 7, color: "amber" },
  { label: "SpaceX", value: 5, color: "red" },
  { label: "Other", value: 39, color: "gray" },
] as const;

registerSnapHandler(
  app,
  async ({ action }): Promise<SnapResponse> => {
    if (action.type === "post") {
      const rawAmount = action.inputs["amount"];
      const amountStr =
        typeof rawAmount === "string" ? rawAmount.replace(/[$,\s]/g, "") : "";
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0) {
        const currentValue = amount * PREMIUM;
        const returnPct = Math.round((PREMIUM - 1) * 100);
        const body = `$${fmtNum(amount)} invested at NAV → $${fmtNum(
          currentValue,
        )} today (+${returnPct.toLocaleString()}%)`;

        return {
          version: "1.0",
          page: {
            theme: { accent: "green" },
            button_layout: "stack",
            elements: {
              type: "stack",
              children: [
                {
                  type: "text",
                  style: "title",
                  content: "$VCX Return Calculator",
                },
                { type: "text", style: "body", content: body },
                {
                  type: "bar_chart",
                  bars: HOLDINGS.map((h) => ({
                    label: h.label,
                    value: h.value,
                    color: h.color,
                  })),
                },
                {
                  type: "text",
                  style: "caption",
                  content: `$650M fund at $5.4B market cap — investors paying ${PREMIUM.toFixed(
                    1,
                  )}x NAV for pre-IPO access`,
                },
              ],
            },
            buttons: [
              {
                label: "Try another amount",
                action: "post",
                target: `${snapBaseUrl()}/vcx-explorer`,
              },
            ],
          },
        };
      }
    }

    return {
      version: "1.0",
      page: {
        theme: { accent: "green" },
        button_layout: "stack",
        elements: {
          type: "stack",
          children: [
            { type: "text", style: "title", content: "$VCX Fund Explorer" },
            {
              type: "text",
              style: "body",
              content: `NAV $${NAV_PER_SHARE} · Market $${CURRENT_PRICE} · ${PREMIUM.toFixed(
                1,
              )}x premium`,
            },
            {
              type: "list",
              style: "plain",
              items: [
                { content: "Anthropic", trailing: "21%" },
                { content: "Databricks", trailing: "18%" },
                { content: "OpenAI", trailing: "10%" },
                { content: "Anduril, SpaceX & others", trailing: "51%" },
              ],
            },
            {
              type: "text_input",
              name: "amount",
              placeholder: "Investment at NAV ($)",
            },
          ],
        },
        buttons: [
          {
            label: "Calculate Return",
            action: "post",
            target: `${snapBaseUrl()}/vcx-explorer`,
          },
        ],
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
