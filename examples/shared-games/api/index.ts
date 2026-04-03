import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult, SnapAction } from "@farcaster/snap";

const SPEC_VERSION = "1.0" as const;

type GameView =
  | "home"
  | "wordle"
  | "canvas"
  | "story"
  | "estimate"
  | "prediction";

type TileColor = "green" | "yellow" | "gray";

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  let urlProto: string | undefined;
  let urlHost: string | undefined;
  try {
    const u = new URL(request.url);
    urlProto = u.protocol.replace(/:$/, "");
    urlHost = u.host;
  } catch {
    // ignore
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.trim() || urlProto || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim() ||
    urlHost;
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3011"}`.replace(/\/$/, "");
}

type SnapPostAction = Extract<SnapAction, { type: "post" }>;

function isSnapPostAction(action: SnapAction): action is SnapPostAction {
  return action.type === "post";
}

function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

// -----------------------------
// Shared in-memory state
// -----------------------------

const WORDLE_ANSWER = "CLASS";
const WORDLE_PREVIOUS_GUESSES = ["CRANE", "MOIST", "CLASH"] as string[];

let wordle = makeWordleState();
function makeWordleState() {
  return {
    answer: WORDLE_ANSWER,
    timeline: WORDLE_PREVIOUS_GUESSES.map((guess) => ({
      guess: guess.toUpperCase(),
      at: Date.now(),
    })),
    guessesByFid: new Map<number, string>(),
  };
}

function resetWordle() {
  wordle = makeWordleState();
}

function getWordleTileColors(guess: string): TileColor[] {
  const result: TileColor[] = Array(5).fill("gray");
  const answerArr = wordle.answer.split("");
  const guessArr = guess.toUpperCase().split("");

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "green";
      answerArr[i] = "_";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "green") continue;
    const idx = answerArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = "yellow";
      answerArr[idx] = "_";
    }
  }

  return result;
}

function tileColorEmoji(c: TileColor): string {
  if (c === "green") return "G";
  if (c === "yellow") return "Y";
  return "_";
}

const PAINT_COLOR_OPTIONS = ["Accent", "Green", "Orange", "Eraser"] as const;

let canvas = makeCanvasState();
function makeCanvasState() {
  return { paintCount: 0 };
}

function resetCanvas() {
  canvas = makeCanvasState();
}

type StoryLine = { text: string; author: string };

const STORY_SEED: StoryLine[] = [
  {
    text: "The last message from Earth arrived at 3:47 AM.",
    author: "@dwr.eth",
  },
  {
    text: 'It was only three words: "They are coming."',
    author: "@vitalik.eth",
  },
  {
    text: "Commander Reyes read it twice, then deleted it.",
    author: "@linda.eth",
  },
  { text: "The crew didn't need to know. Not yet.", author: "@ace" },
  {
    text: "But the ship's AI had already intercepted the transmission.",
    author: "@ccarella",
  },
];

let story = makeStoryState();
function makeStoryState() {
  return {
    lines: STORY_SEED,
    proposals: new Map<string, number>([
      ["It began composing a reply before anyone could stop it.", 2],
      ['"I recommend immediate course correction," it said calmly.', 1],
      [
        "In the server room, a light that had been off for years flickered on.",
        3,
      ],
    ]),
    votesByFid: new Map<number, string>(),
    voteLockThreshold: 3,
  };
}

function resetStory() {
  story = makeStoryState();
}

function getTopProposal(): { line: string; votes: number } | undefined {
  let best: { line: string; votes: number } | undefined;
  for (const [line, votes] of story.proposals.entries()) {
    if (!best || votes > best.votes) best = { line, votes };
  }
  return best;
}

let estimate = makeEstimateState();
function makeEstimateState() {
  return {
    target: 80000,
    guessesByFid: new Map<number, number>(),
    min: 0,
    max: 500000,
    step: 1000,
  };
}

function resetEstimate() {
  estimate = makeEstimateState();
}

let prediction = makePredictionState();
function makePredictionState() {
  const votesByFid = new Map<number, "yes" | "no">();
  const YES = 72;
  const total = 100;
  for (let i = 0; i < total; i++) {
    votesByFid.set(i + 1, i < YES ? "yes" : "no");
  }
  return { votesByFid };
}

function resetPrediction() {
  prediction = makePredictionState();
}

function getPredictionCounts() {
  let yes = 0;
  let no = 0;
  for (const v of prediction.votesByFid.values()) {
    if (v === "yes") yes += 1;
    else no += 1;
  }
  return { yes, no };
}

// -----------------------------
// Page builders
// -----------------------------

function buildHomePage(args: { snapBaseUrl: string }): SnapHandlerResult {
  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "subtitle",
            "game-select",
            "caption",
            "btn-open",
          ],
        },
        title: {
          type: "item",
          props: { title: "Shared Games" },
        },
        subtitle: {
          type: "item",
          props: { description: "Pick a game to play, then press Open." },
        },
        "game-select": {
          type: "toggle_group",
          props: {
            name: "game_choice",
            options: [{ value: "wordle", label: "Wordle" }, { value: "canvas", label: "Canvas" }, { value: "story", label: "Story" }, { value: "estimate", label: "Estimate" }, { value: "predict", label: "Predict" }],
          },
        },
        caption: {
          type: "badge",
          props: { content: "All games update from shared server state." },
        },
        "btn-open": {
          type: "button",
          props: { label: "Open" },
          on: {
            press: {
              action: "submit",
              params: { target: `${args.snapBaseUrl}/?view=home` },
            },
          },
        },
      },
    },
  };
}

function buildWordlePage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapHandlerResult {
  const timelineGuesses = wordle.timeline.map((t) => t.guess).slice(0, 6);

  const counts = new Map<string, number>();
  for (const g of timelineGuesses) counts.set(g, (counts.get(g) ?? 0) + 1);
  const popular =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "CLASS";

  const caption =
    args.feedback ??
    `Most popular guess: ${popular}. Submit a new 5-letter word.`;

  // Represent wordle guesses as items with color-coded letters
  const guessIds: string[] = [];
  for (let i = 0; i < Math.min(timelineGuesses.length, 6); i++) {
    guessIds.push(`guess-${i}`);
  }

  const elements: Record<string, unknown> = {
    page: {
      type: "stack",
      props: {},
      children: [
        "title",
        "guess-input",
        ...guessIds,
        "caption",
        "btn-row",
      ],
    },
    title: {
      type: "item",
      props: { title: "Crowd Wordle" },
    },
    "guess-input": {
      type: "input",
      props: { name: "guess", placeholder: "e.g. CLASS", maxLength: 5 },
    },
    caption: {
      type: "badge",
      props: {
        content:
          caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      },
    },
    "btn-row": {
      type: "stack",
      props: { direction: "horizontal" },
      children: ["btn-submit", "btn-home", "btn-reset"],
    },
    "btn-submit": {
      type: "button",
      props: { label: "Submit" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=wordle` },
        },
      },
    },
    "btn-home": {
      type: "button",
      props: { label: "Home", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=home` },
        },
      },
    },
    "btn-reset": {
      type: "button",
      props: { label: "Reset", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=wordle&reset=1` },
        },
      },
    },
  };

  // Add guess rows as items showing the letter pattern
  for (let i = 0; i < guessIds.length; i++) {
    const guess = timelineGuesses[i]!;
    const colors = getWordleTileColors(guess);
    const pattern = colors.map((c, j) => `${guess[j]}${tileColorEmoji(c)}`).join(" ");
    elements[guessIds[i]!] = {
      type: "item",
      props: { title: guess, description: pattern },
    };
  }

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: elements as any,
    },
  };
}

function buildCanvasPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapHandlerResult {
  const caption =
    args.feedback ?? `Canvas has ${canvas.paintCount} paint actions so far.`;

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "body",
            "color-picker",
            "canvas-image",
            "caption",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Pixel Canvas" },
        },
        body: {
          type: "item",
          props: {
            description:
              "Pick a color and paint! The canvas is a shared pixel art board.",
          },
        },
        "color-picker": {
          type: "toggle_group",
          props: {
            name: "paint_color",
            options: [{ value: "accent", label: "Accent" }, { value: "green", label: "Green" }, { value: "orange", label: "Orange" }, { value: "eraser", label: "Eraser" }],
          },
        },
        "canvas-image": {
          type: "image",
          props: {
            url: "https://placehold.co/400x400.png?text=Pixel+Canvas",
            aspect: "1:1",
          },
        },
        caption: {
          type: "badge",
          props: {
            content:
              caption.length > 100
                ? caption.slice(0, 97) + "..."
                : caption,
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-paint", "btn-home", "btn-clear"],
        },
        "btn-paint": {
          type: "button",
          props: { label: "Paint" },
          on: {
            press: {
              action: "submit",
              params: { target: `${args.snapBaseUrl}/?view=canvas` },
            },
          },
        },
        "btn-home": {
          type: "button",
          props: { label: "Home", variant: "secondary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${args.snapBaseUrl}/?view=home` },
            },
          },
        },
        "btn-clear": {
          type: "button",
          props: { label: "Clear", variant: "secondary" },
          on: {
            press: {
              action: "submit",
              params: {
                target: `${args.snapBaseUrl}/?view=canvas&reset=1`,
              },
            },
          },
        },
      },
    },
  };
}

function buildStoryPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapHandlerResult {
  const lastLines = story.lines.slice(-4);

  const top = getTopProposal();
  const captionBase =
    top && top.votes > 0
      ? `Top candidate: "${
          top.line.length > 70 ? top.line.slice(0, 67) + "..." : top.line
        }" (${top.votes} votes)`
      : "Propose the next line to steer the story.";

  const caption = args.feedback ?? captionBase;

  const lineIds = lastLines.map((_, i) => `line-${i}`);

  const elements: Record<string, unknown> = {
    page: {
      type: "stack",
      props: {},
      children: [
        "title",
        ...lineIds,
        "proposal-input",
        "caption",
        "btn-row",
      ],
    },
    title: {
      type: "item",
      props: { title: "Crowd Story" },
    },
    "proposal-input": {
      type: "input",
      props: {
        name: "proposal_line",
        placeholder: "Propose a short next line",
        maxLength: 80,
      },
    },
    caption: {
      type: "badge",
      props: {
        content:
          caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      },
    },
    "btn-row": {
      type: "stack",
      props: {},
      children: ["btn-propose", "btn-home", "btn-reset"],
    },
    "btn-propose": {
      type: "button",
      props: { label: "Propose" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=story` },
        },
      },
    },
    "btn-home": {
      type: "button",
      props: { label: "Home", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=home` },
        },
      },
    },
    "btn-reset": {
      type: "button",
      props: { label: "Reset", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=story&reset=1` },
        },
      },
    },
  };

  for (let i = 0; i < lastLines.length; i++) {
    const l = lastLines[i]!;
    elements[lineIds[i]!] = {
      type: "item",
      props: {
        title: l.text.length > 100 ? l.text.slice(0, 97) + "..." : l.text,
        description:
          l.author.length > 40 ? l.author.slice(0, 37) + "..." : l.author,
      },
    };
  }

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: elements as any,
    },
  };
}

function buildEstimatePage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapHandlerResult {
  const guesses = [...estimate.guessesByFid.entries()].map(([fid, value]) => ({
    fid,
    value,
    diff: Math.abs(value - estimate.target),
  }));
  guesses.sort((a, b) => a.diff - b.diff);

  const sliderDefaultValue = (estimate.min + estimate.max) / 2;

  const closest = guesses[0];
  const caption =
    args.feedback ??
    (closest
      ? `Closest so far: ${closest.value.toLocaleString()} (diff ${closest.diff.toLocaleString()}).`
      : "Slide to your estimate, then lock it in.");

  const guessItemIds = guesses.length > 0
    ? guesses.slice(0, 4).map((_, i) => `guess-${i}`)
    : ["guess-empty"];

  const elements: Record<string, unknown> = {
    page: {
      type: "stack",
      props: {},
      children: [
        "title",
        "body",
        "slider",
        ...guessItemIds,
        "caption",
        "btn-row",
      ],
    },
    title: {
      type: "item",
      props: { title: "Estimate Challenge" },
    },
    body: {
      type: "item",
      props: {
        description:
          "How many daily active users does Farcaster have? Guess a number.",
      },
    },
    slider: {
      type: "slider",
      props: {
        name: "estimate_guess",
        min: estimate.min,
        max: estimate.max,
        step: estimate.step,
        value: sliderDefaultValue,
        label: "Your estimate",
        minLabel: "0",
        maxLabel: "500K",
      },
    },
    caption: {
      type: "badge",
      props: {
        content:
          caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      },
    },
    "btn-row": {
      type: "stack",
      props: { direction: "horizontal" },
      children: ["btn-lock", "btn-home", "btn-reset"],
    },
    "btn-lock": {
      type: "button",
      props: { label: "Lock in" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=estimate` },
        },
      },
    },
    "btn-home": {
      type: "button",
      props: { label: "Home", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=home` },
        },
      },
    },
    "btn-reset": {
      type: "button",
      props: { label: "Reset", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: `${args.snapBaseUrl}/?view=estimate&reset=1` },
        },
      },
    },
  };

  if (guesses.length > 0) {
    for (let i = 0; i < Math.min(guesses.length, 4); i++) {
      const g = guesses[i]!;
      elements[`guess-${i}`] = {
        type: "item",
        props: {
          title: `Guess ${g.value.toLocaleString()}`,
          description: `diff ${g.diff.toLocaleString()}`,
        },
      };
    }
  } else {
    elements["guess-empty"] = {
      type: "item",
      props: { description: "Be the first to estimate." },
    };
  }

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: elements as any,
    },
  };
}

function buildPredictionPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapHandlerResult {
  const { yes, no } = getPredictionCounts();
  const total = yes + no;
  const maxVote = Math.max(yes, no, 1);
  const caption =
    args.feedback ??
    (total > 0
      ? `Current split: Yes ${yes} · No ${no}`
      : "Vote to start the tournament.");

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "body",
            "vote-group",
            "bar-yes",
            "bar-no",
            "caption",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Prediction Tournament" },
        },
        body: {
          type: "item",
          props: { description: "Will GPT-5 launch before July 2026?" },
        },
        "vote-group": {
          type: "toggle_group",
          props: { name: "prediction_vote", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
        },
        "bar-yes": {
          type: "progress",
          props: { value: yes, max: maxVote, label: `Yes (${yes})` },
        },
        "bar-no": {
          type: "progress",
          props: { value: no, max: maxVote, label: `No (${no})` },
        },
        caption: {
          type: "badge",
          props: {
            content:
              caption.length > 100
                ? caption.slice(0, 97) + "..."
                : caption,
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-vote", "btn-home", "btn-reset"],
        },
        "btn-vote": {
          type: "button",
          props: { label: "Vote" },
          on: {
            press: {
              action: "submit",
              params: { target: `${args.snapBaseUrl}/?view=prediction` },
            },
          },
        },
        "btn-home": {
          type: "button",
          props: { label: "Home", variant: "secondary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${args.snapBaseUrl}/?view=home` },
            },
          },
        },
        "btn-reset": {
          type: "button",
          props: { label: "Reset", variant: "secondary" },
          on: {
            press: {
              action: "submit",
              params: {
                target: `${args.snapBaseUrl}/?view=prediction&reset=1`,
              },
            },
          },
        },
      },
    },
  };
}

function viewFromGameChoice(
  choice: string,
): Exclude<GameView, "home"> {
  const lower = choice.toLowerCase();
  if (lower === "wordle") return "wordle";
  if (lower === "canvas") return "canvas";
  if (lower === "story") return "story";
  if (lower === "estimate") return "estimate";
  if (lower === "predict") return "prediction";
  return "wordle";
}

// -----------------------------
// Snap server
// -----------------------------

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const viewParam = url.searchParams.get("view");
  const view: GameView =
    viewParam === "wordle" ||
    viewParam === "canvas" ||
    viewParam === "story" ||
    viewParam === "estimate" ||
    viewParam === "prediction"
      ? viewParam
      : "home";
  const reset = url.searchParams.get("reset") === "1";
  const snapBaseUrl = snapBaseUrlFromRequest(ctx.request);

  if (view === "home") {
    // Check if user selected a game via toggle_group
    if (isSnapPostAction(ctx.action)) {
      const gameChoice = ctx.action.inputs["game_choice"];
      if (typeof gameChoice === "string" && gameChoice) {
        return pageForView(viewFromGameChoice(gameChoice), {
          snapBaseUrl,
        });
      }
    }
    return buildHomePage({ snapBaseUrl });
  }

  if (view === "wordle") {
    let feedback: string | undefined;
    if (reset) {
      resetWordle();
      feedback = "Wordle reset. Crowd board cleared.";
    } else if (isSnapPostAction(ctx.action)) {
      const raw = ctx.action.inputs.guess;
      const guess = typeof raw === "string" ? raw.toUpperCase() : "";
      const sanitized = guess.replace(/[^A-Z]/g, "").slice(0, 5);
      if (sanitized.length !== 5) {
        feedback = "Enter exactly 5 letters (A-Z).";
      } else {
        wordle.guessesByFid.set(ctx.action.fid, sanitized);
        wordle.timeline.push({ guess: sanitized, at: ctx.action.timestamp });
        wordle.timeline = wordle.timeline.slice(-6);
      }
    }
    return buildWordlePage({ snapBaseUrl, feedback });
  }

  if (view === "canvas") {
    let feedback: string | undefined;
    if (reset) {
      resetCanvas();
      feedback = "Canvas cleared.";
    } else if (isSnapPostAction(ctx.action)) {
      const colorRaw = ctx.action.inputs.paint_color;
      const selected = typeof colorRaw === "string" ? colorRaw : undefined;

      if (!selected) {
        feedback = "Pick a paint color first.";
      } else {
        canvas.paintCount++;
        feedback = `Painted with ${selected}! Total: ${canvas.paintCount} actions.`;
      }
    }
    return buildCanvasPage({ snapBaseUrl, feedback });
  }

  if (view === "story") {
    let feedback: string | undefined;
    if (reset) {
      resetStory();
      feedback = "Story reset.";
    } else if (isSnapPostAction(ctx.action)) {
      const raw = ctx.action.inputs.proposal_line;
      const proposed = typeof raw === "string" ? normalizeWhitespace(raw) : "";
      if (!proposed || proposed.length < 3) {
        feedback = "Propose a line (at least 3 characters).";
      } else if (proposed.length > 80) {
        feedback = "Keep the line under 80 characters.";
      } else {
        const prev = story.votesByFid.get(ctx.action.fid);
        if (prev) {
          const prevCount = story.proposals.get(prev) ?? 0;
          if (prevCount <= 1) story.proposals.delete(prev);
          else story.proposals.set(prev, prevCount - 1);
        }
        story.votesByFid.set(ctx.action.fid, proposed);
        story.proposals.set(proposed, (story.proposals.get(proposed) ?? 0) + 1);

        const top = getTopProposal();
        if (top && top.votes >= story.voteLockThreshold) {
          story.lines = [...story.lines, { text: top.line, author: "@shared" }];
          story.proposals.clear();
          story.votesByFid.clear();
          feedback = "Locked in! A new story line is now part of the chapter.";
        }
      }
    }
    return buildStoryPage({ snapBaseUrl, feedback });
  }

  if (view === "estimate") {
    let feedback: string | undefined;
    if (reset) {
      resetEstimate();
      feedback = "Estimates cleared.";
    } else if (isSnapPostAction(ctx.action)) {
      const raw = ctx.action.inputs.estimate_guess;
      const guessNum = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(guessNum)) {
        feedback = "Estimate must be a number.";
      } else if (guessNum < estimate.min || guessNum > estimate.max) {
        feedback = "Estimate out of bounds.";
      } else {
        const aligned = guessNum - (guessNum % estimate.step);
        if (aligned !== guessNum) {
          feedback = "Estimate must align with the slider step.";
        } else {
          estimate.guessesByFid.set(ctx.action.fid, guessNum);
        }
      }
    }
    return buildEstimatePage({ snapBaseUrl, feedback });
  }

  // prediction
  let feedback: string | undefined;
  if (reset) {
    resetPrediction();
    feedback = "Prediction reset.";
  } else if (isSnapPostAction(ctx.action)) {
    const raw = ctx.action.inputs.prediction_vote;
    const vote = typeof raw === "string" ? raw : "";
    const nextVote = vote === "yes" ? "yes" : vote === "no" ? "no" : undefined;
    if (!nextVote) {
      feedback = "Pick Yes or No first.";
    } else {
      prediction.votesByFid.set(ctx.action.fid, nextVote);
    }
  }
  return buildPredictionPage({ snapBaseUrl, feedback });
});

export default app;

export const runtime = "edge";
export const GET = handle(app);
export const POST = handle(app);

function pageForView(
  view: Exclude<GameView, "home">,
  args: { snapBaseUrl: string },
): SnapHandlerResult {
  switch (view) {
    case "wordle":
      return buildWordlePage({ snapBaseUrl: args.snapBaseUrl });
    case "canvas":
      return buildCanvasPage({ snapBaseUrl: args.snapBaseUrl });
    case "story":
      return buildStoryPage({ snapBaseUrl: args.snapBaseUrl });
    case "estimate":
      return buildEstimatePage({ snapBaseUrl: args.snapBaseUrl });
    case "prediction":
      return buildPredictionPage({ snapBaseUrl: args.snapBaseUrl });
    default: {
      const _exhaustive: never = view;
      throw new Error(`Unhandled view: ${String(_exhaustive)}`);
    }
  }
}
