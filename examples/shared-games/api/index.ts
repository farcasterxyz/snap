import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import {
  POST_GRID_TAP_KEY,
  DEFAULT_THEME_ACCENT,
  type SnapAction,
  type SnapResponse,
} from "@farcaster/snap";

const SPEC_VERSION = "1.0" as const;

const BUTTONS = {
  homeOpen: "open_game",
  wordleSubmit: "wordle_submit",
  canvasPaint: "canvas_paint",
  storyPropose: "story_propose",
  estimateLock: "estimate_lock",
  predictionVote: "prediction_vote",
} as const;

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

function getGridTap(
  action: SnapPostAction,
): { row: number; col: number } | undefined {
  const raw = action.inputs[POST_GRID_TAP_KEY];
  if (!raw || typeof raw !== "object") return undefined;
  const maybe = raw as { row?: unknown; col?: unknown };
  if (typeof maybe.row !== "number" || typeof maybe.col !== "number")
    return undefined;
  return { row: maybe.row, col: maybe.col };
}

function buildResponse(page: SnapResponse["page"]): SnapResponse {
  return {
    version: SPEC_VERSION,
    page,
  };
}

function snapTheme(): SnapResponse["page"]["theme"] {
  return { accent: DEFAULT_THEME_ACCENT };
}

function textEl(style: "title" | "body" | "caption", content: string) {
  return { type: "text" as const, style, content };
}

function stackElements(children: SnapResponse["page"]["elements"]["children"]) {
  return { type: "stack" as const, children };
}

function clampInt(n: number, min: number, max: number): number {
  const v = Math.floor(n);
  if (v < min) return min;
  if (v > max) return max;
  return v;
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

  // First pass: greens (correct position)
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "green";
      answerArr[i] = "_";
    }
  }

  // Second pass: yellows (present, wrong position)
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

function tileColorToHex(c: TileColor): string {
  if (c === "green") return "#22C55E";
  if (c === "yellow") return "#F59E0B";
  return "#6B7280";
}

const CANVAS_COLS = 8;
const CANVAS_ROWS = 8;
const CANVAS_EMPTY = "#F3F4F6";

const PAINT_COLOR_OPTIONS = ["Accent", "Green", "Orange", "Eraser"] as const;
const PAINT_COLOR_TO_HEX: Record<
  (typeof PAINT_COLOR_OPTIONS)[number],
  string | null
> = {
  Accent: "#8B5CF6",
  Green: "#22C55E",
  Orange: "#F97316",
  Eraser: null,
};

let canvas = makeCanvasState();
function makeCanvasState() {
  const pixels = new Map<number, string>();
  const set = (r: number, c: number, color: string) => {
    if (r < 0 || r >= CANVAS_ROWS || c < 0 || c >= CANVAS_COLS) return;
    pixels.set(r * CANVAS_COLS + c, color);
  };

  // Smiley-ish seed (roughly inspired by the original 16x16)
  const YELLOW = "#EAB308";
  const BLUE = "#3B82F6";
  const RED = "#EF4444";

  [2, 3, 4, 5].forEach((c) => set(1, c, YELLOW));
  [1, 6].forEach((c) => set(2, c, YELLOW));
  [1, 6].forEach((c) => set(5, c, YELLOW));
  [2, 3, 4, 5].forEach((c) => set(6, c, YELLOW));
  [2, 5].forEach((c) => [2, 3].forEach((r) => set(r, c, BLUE)));

  [3, 4].forEach((c) => set(4, c, RED));
  set(3, 3, RED);
  set(4, 4, RED);

  // Scatter a few art pixels
  set(0, 0, "#8B5CF6");
  set(0, 7, "#F97316");
  set(7, 0, "#22C55E");
  set(7, 7, "#06B6D4");

  return { pixels };
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
  // Use small vote counts so the user can see state changes immediately.
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
  // Seed with the same rough split as the UI.
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

function buildHomePage(args: {
  snapBaseUrl: string;
  selection?: { row: number; col: number };
}): SnapResponse {
  const gridCols = 3;
  const gridRows = 2;

  const cellToView: Array<Array<GameView | null>> = [
    ["wordle", "canvas", "story"],
    ["estimate", "prediction", null],
  ];

  const cells = [] as Array<{
    row: number;
    col: number;
    color?: string;
    content?: string;
  }>;
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const view = cellToView[row]?.[col] ?? null;
      const label =
        view === "wordle"
          ? "Wordle"
          : view === "canvas"
          ? "Canvas"
          : view === "story"
          ? "Story"
          : view === "estimate"
          ? "Estimate"
          : view === "prediction"
          ? "Predict"
          : "";
      cells.push({
        row,
        col,
        color: label ? DEFAULT_THEME_ACCENT : CANVAS_EMPTY,
        content: label || undefined,
      });
    }
  }

  const subtitle =
    args.selection && args.selection.col >= 0
      ? "Selection made. Tap Open to enter."
      : "Tap a game tile, then press Open.";

  return buildResponse({
    theme: snapTheme(),
    button_layout: "stack",
    elements: stackElements([
      textEl("title", "Shared Games"),
      textEl("body", subtitle),
      {
        type: "grid",
        cols: gridCols,
        rows: gridRows,
        interactive: true,
        cellSize: "square",
        gap: "small",
        cells,
      },
      textEl("caption", "All games update from shared server state."),
    ]),
    buttons: [
      {
        label: "Open",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
    ],
  });
}

function buildWordlePage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapResponse {
  const timelineGuesses = wordle.timeline.map((t) => t.guess).slice(0, 6);
  const filledGuesses = [
    ...timelineGuesses,
    ...Array.from(
      { length: Math.max(0, 6 - timelineGuesses.length) },
      () => "",
    ),
  ].slice(0, 6);

  const counts = new Map<string, number>();
  for (const g of timelineGuesses) counts.set(g, (counts.get(g) ?? 0) + 1);
  const popular =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "CLASS";

  const caption =
    args.feedback ??
    `Most popular guess: ${popular}. Submit a new 5-letter word.`;

  const cells = [] as Array<{
    row: number;
    col: number;
    color?: string;
    content?: string;
  }>;
  for (let row = 0; row < 6; row++) {
    const guess = filledGuesses[row] || "";
    if (!guess) {
      for (let col = 0; col < 5; col++) {
        cells.push({ row, col });
      }
      continue;
    }
    const colors = getWordleTileColors(guess);
    const letters = guess.toUpperCase().split("");
    for (let col = 0; col < 5; col++) {
      const tc = colors[col]!;
      cells.push({
        row,
        col,
        content: letters[col],
        color: tileColorToHex(tc),
      });
    }
  }

  return buildResponse({
    theme: snapTheme(),
    button_layout: "row",
    elements: stackElements([
      textEl("title", "Crowd Wordle"),
      {
        type: "text_input",
        name: "guess",
        placeholder: "e.g. CLASS",
        maxLength: 5,
      },
      {
        type: "grid",
        cols: 5,
        rows: 6,
        cellSize: "square",
        gap: "none",
        cells,
      },
      textEl(
        "caption",
        caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      ),
    ]),
    buttons: [
      {
        label: "Submit",
        action: "post",
        target: `${args.snapBaseUrl}/?view=wordle`,
      },
      {
        label: "Home",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
      {
        label: "Reset",
        action: "post",
        target: `${args.snapBaseUrl}/?view=wordle&reset=1`,
      },
    ],
  });
}

function buildCanvasPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapResponse {
  const cells = [] as Array<{
    row: number;
    col: number;
    color?: string;
    content?: string;
  }>;
  for (let row = 0; row < CANVAS_ROWS; row++) {
    for (let col = 0; col < CANVAS_COLS; col++) {
      const key = row * CANVAS_COLS + col;
      const color = canvas.pixels.get(key);
      cells.push({
        row,
        col,
        color: color ?? CANVAS_EMPTY,
      });
    }
  }

  const caption = args.feedback ?? "Tap a pixel tile, then press Paint.";

  return buildResponse({
    theme: snapTheme(),
    button_layout: "row",
    elements: stackElements([
      textEl("title", "Pixel Canvas"),
      {
        type: "button_group",
        name: "paint_color",
        options: [...PAINT_COLOR_OPTIONS],
        style: "row",
      },
      {
        type: "grid",
        cols: CANVAS_COLS,
        rows: CANVAS_ROWS,
        interactive: true,
        cellSize: "square",
        gap: "none",
        cells,
      },
      textEl(
        "caption",
        caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      ),
    ]),
    buttons: [
      {
        label: "Paint",
        action: "post",
        target: `${args.snapBaseUrl}/?view=canvas`,
      },
      {
        label: "Home",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
      {
        label: "Clear",
        action: "post",
        target: `${args.snapBaseUrl}/?view=canvas&reset=1`,
      },
    ],
  });
}

function buildStoryPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapResponse {
  const lastLines = story.lines.slice(-4);
  const listItems = lastLines.map((l) => ({
    content: l.text.length > 100 ? l.text.slice(0, 97) + "..." : l.text,
    trailing: l.author.length > 40 ? l.author.slice(0, 37) + "..." : l.author,
  }));

  const top = getTopProposal();
  const captionBase =
    top && top.votes > 0
      ? `Top candidate: "${
          top.line.length > 70 ? top.line.slice(0, 67) + "..." : top.line
        }" (${top.votes} votes)`
      : "Propose the next line to steer the story.";

  const caption = args.feedback ?? captionBase;

  return buildResponse({
    theme: snapTheme(),
    button_layout: "stack",
    elements: stackElements([
      textEl("title", "Crowd Story"),
      {
        type: "list",
        style: "unordered",
        items: listItems.length ? listItems : [{ content: "No lines yet." }],
      },
      {
        type: "text_input",
        name: "proposal_line",
        placeholder: "Propose a short next line",
        maxLength: 80,
      },
      textEl(
        "caption",
        caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      ),
    ]),
    buttons: [
      {
        label: "Propose",
        action: "post",
        target: `${args.snapBaseUrl}/?view=story`,
      },
      {
        label: "Home",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
      {
        label: "Reset",
        action: "post",
        target: `${args.snapBaseUrl}/?view=story&reset=1`,
      },
    ],
  });
}

function buildEstimatePage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapResponse {
  const guesses = [...estimate.guessesByFid.entries()].map(([fid, value]) => ({
    fid,
    value,
    diff: Math.abs(value - estimate.target),
  }));
  guesses.sort((a, b) => a.diff - b.diff);

  const sliderDefaultValue = (estimate.min + estimate.max) / 2;

  const listItems =
    guesses.length > 0
      ? guesses.slice(0, 4).map((g) => ({
          content: `Guess ${g.value.toLocaleString()}`,
          trailing: `diff ${g.diff.toLocaleString()}`,
        }))
      : [{ content: "Be the first to estimate." }];

  const closest = guesses[0];
  const caption =
    args.feedback ??
    (closest
      ? `Closest so far: ${closest.value.toLocaleString()} (diff ${closest.diff.toLocaleString()}).`
      : "Slide to your estimate, then lock it in.");

  return buildResponse({
    theme: snapTheme(),
    button_layout: "row",
    elements: stackElements([
      textEl("title", "Estimate Challenge"),
      textEl(
        "body",
        "How many daily active users does Farcaster have? Guess a number.",
      ),
      {
        type: "slider",
        name: "estimate_guess",
        min: estimate.min,
        max: estimate.max,
        step: estimate.step,
        value: sliderDefaultValue,
        label: "Your estimate",
        minLabel: "0",
        maxLabel: "500K",
      },
      {
        type: "list",
        style: "plain",
        items: listItems,
      },
      textEl(
        "caption",
        caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      ),
    ]),
    buttons: [
      {
        label: "Lock in",
        action: "post",
        target: `${args.snapBaseUrl}/?view=estimate`,
      },
      {
        label: "Home",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
      {
        label: "Reset",
        action: "post",
        target: `${args.snapBaseUrl}/?view=estimate&reset=1`,
      },
    ],
  });
}

function buildPredictionPage(args: {
  snapBaseUrl: string;
  feedback?: string;
}): SnapResponse {
  const { yes, no } = getPredictionCounts();
  const total = yes + no;
  const caption =
    args.feedback ??
    (total > 0
      ? `Current split: Yes ${yes} · No ${no}`
      : "Vote to start the tournament.");

  return buildResponse({
    theme: snapTheme(),
    button_layout: "row",
    elements: stackElements([
      textEl("title", "Prediction Tournament"),
      textEl("body", "Will GPT-5 launch before July 2026?"),
      {
        type: "button_group",
        name: "prediction_vote",
        options: ["Yes", "No"],
        style: "row",
      },
      {
        type: "bar_chart",
        bars: [
          { label: "Yes", value: yes },
          { label: "No", value: no },
        ],
        color: "accent",
      },
      textEl(
        "caption",
        caption.length > 100 ? caption.slice(0, 97) + "..." : caption,
      ),
    ]),
    buttons: [
      {
        label: "Vote",
        action: "post",
        target: `${args.snapBaseUrl}/?view=prediction`,
      },
      {
        label: "Home",
        action: "post",
        target: `${args.snapBaseUrl}/?view=home`,
      },
      {
        label: "Reset",
        action: "post",
        target: `${args.snapBaseUrl}/?view=prediction&reset=1`,
      },
    ],
  });
}

function viewFromHomeSelection(sel: {
  row: number;
  col: number;
}): Exclude<GameView, "home"> {
  if (sel.row === 0 && sel.col === 0) return "wordle";
  if (sel.row === 0 && sel.col === 1) return "canvas";
  if (sel.row === 0 && sel.col === 2) return "story";
  if (sel.row === 1 && sel.col === 0) return "estimate";
  if (sel.row === 1 && sel.col === 1) return "prediction";
  return "wordle";
}

// -----------------------------
// Snap server
// -----------------------------

const app = new Hono();

registerSnapHandler(app, async ({ action, request }) => {
  const url = new URL(request.url);
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
  const snapBaseUrl = snapBaseUrlFromRequest(request);

  if (view === "home") {
    let selection: { row: number; col: number } | undefined;
    if (isSnapPostAction(action)) {
      selection = getGridTap(action);
    }
    if (isSnapPostAction(action) && selection) {
      return pageForView(viewFromHomeSelection(selection), {
        snapBaseUrl,
      });
    }
    return buildHomePage({ snapBaseUrl, selection });
  }

  if (view === "wordle") {
    let feedback: string | undefined;
    if (reset) {
      resetWordle();
      feedback = "Wordle reset. Crowd board cleared.";
    } else if (isSnapPostAction(action)) {
      const raw = action.inputs.guess;
      const guess = typeof raw === "string" ? raw.toUpperCase() : "";
      const sanitized = guess.replace(/[^A-Z]/g, "").slice(0, 5);
      if (sanitized.length !== 5) {
        feedback = "Enter exactly 5 letters (A-Z).";
      } else {
        wordle.guessesByFid.set(action.fid, sanitized);
        wordle.timeline.push({ guess: sanitized, at: action.timestamp });
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
    } else if (isSnapPostAction(action)) {
      const colorRaw = action.inputs.paint_color;
      const selected = typeof colorRaw === "string" ? colorRaw : undefined;
      const tap = getGridTap(action);

      if (!tap) {
        feedback = "Tap a pixel tile first, then press Paint.";
      } else if (!selected) {
        feedback = "Pick a paint color first.";
      } else {
        const paintHex =
          PAINT_COLOR_TO_HEX[selected as keyof typeof PAINT_COLOR_TO_HEX];
        const key = tap.row * CANVAS_COLS + tap.col;
        if (
          tap.row < 0 ||
          tap.row >= CANVAS_ROWS ||
          tap.col < 0 ||
          tap.col >= CANVAS_COLS
        ) {
          feedback = "That pixel is out of bounds.";
        } else if (paintHex === undefined) {
          feedback = "Pick a valid paint color.";
        } else if (paintHex === null) {
          canvas.pixels.delete(key);
        } else {
          canvas.pixels.set(key, paintHex);
        }
      }
    }
    return buildCanvasPage({ snapBaseUrl, feedback });
  }

  if (view === "story") {
    let feedback: string | undefined;
    if (reset) {
      resetStory();
      feedback = "Story reset.";
    } else if (isSnapPostAction(action)) {
      const raw = action.inputs.proposal_line;
      const proposed = typeof raw === "string" ? normalizeWhitespace(raw) : "";
      if (!proposed || proposed.length < 3) {
        feedback = "Propose a line (at least 3 characters).";
      } else if (proposed.length > 80) {
        feedback = "Keep the line under 80 characters.";
      } else {
        const prev = story.votesByFid.get(action.fid);
        if (prev) {
          const prevCount = story.proposals.get(prev) ?? 0;
          if (prevCount <= 1) story.proposals.delete(prev);
          else story.proposals.set(prev, prevCount - 1);
        }
        story.votesByFid.set(action.fid, proposed);
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
    } else if (isSnapPostAction(action)) {
      const raw = action.inputs.estimate_guess;
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
          estimate.guessesByFid.set(action.fid, guessNum);
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
  } else if (isSnapPostAction(action)) {
    const raw = action.inputs.prediction_vote;
    const vote = typeof raw === "string" ? raw : "";
    const nextVote = vote === "Yes" ? "yes" : vote === "No" ? "no" : undefined;
    if (!nextVote) {
      feedback = "Pick Yes or No first.";
    } else {
      prediction.votesByFid.set(action.fid, nextVote);
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
): SnapResponse {
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
