# SnapResponse

> Part of the [Farcaster Snaps spec](./SPEC.md) (draft).

`SnapResponse` is the JSON payload returned by a snap.

Every valid response is a page payload with this shape:

```json
{
  "version": "1.0",
  "page": {
    "theme": {
      "accent": "purple"
    },
    "elements": {
      "type": "stack",
      "children": [
        { "type": "text", "style": "title", "content": "Best sci-fi movies" },
        {
          "type": "button_group",
          "name": "pick",
          "options": ["Arrival", "Dune", "Interstellar"]
        }
      ]
    },
    "buttons": [
      {
        "label": "Submit",
        "action": "post",
        "target": "https://example.com/submit"
      }
    ],
    "button_layout": "stack"
  }
}
```

## Top-Level Fields

| Field                | Required | Description                                                                                                                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`            | Yes      | Spec version. Must be `"1.0"`.                                                                                                                                                     |
| `page.theme`         | No       | Accent color for the snap. Client derives all visual styling from this + the app's current light/dark mode. Defaults to `"purple"`.                              |
| `page.theme.accent`  | No       | Palette color name: `gray`, `blue`, `red`, `amber`, `green`, `teal`, `purple`, `pink`.                                                                                                                                                     |
| `page.elements`      | Yes      | Page body tree root. MUST be `{ "type": "stack", "children": [...] }`. Children render top to bottom. Min 1, max 5 children. Max 1 media element (image, video, or grid) in stack. |
| `page.buttons`       | No       | Array of action buttons at the bottom. Min 0, max 4.                                                                                                                               |
| `page.button_layout` | No       | Layout for action buttons: `"stack"` (default, vertical), `"row"` (horizontal), `"grid"` (2-column grid).                                                                          |
| `page.effects`       | No       | Array of effect names to trigger on page load.                                                                                                                                     |

## Page Root (`stack`)

`page.elements` is a tree root, not a flat list. It must be a `stack` node: a vertical list of child elements.

Rules:

- `page.elements.type` MUST be `"stack"`.
- `page.elements.children` is an array of elements (min 1, max 5).
- Max 1 media element (`image`, `video`, or `grid`) per page.

## Element Types

The page body is a tree whose root is always a `stack`. `stack.children` is the vertical list of blocks; the client renders them in order top to bottom. The client controls sizing, spacing, fonts, and padding. Snaps do not specify pixel dimensions, margins, or CSS. Each element type has a fixed set of properties; unknown properties are ignored.

### `stack` (page root only)

The snap `page.elements` object. Not used inside `group` children.

```json
{
  "type": "stack",
  "children": [{ "type": "text", "style": "title", "content": "Hello" }]
}
```

| Property   | Required | Values                                                                                 |
| ---------- | -------- | -------------------------------------------------------------------------------------- |
| `type`     | Yes      | Must be `"stack"`.                                                                     |
| `children` | Yes      | Min 1, max 5 elements (same types as in this document: `text`, `image`, `group`, ...). |

### `text`

Renders text content in a predefined style.

```json
{ "type": "text", "style": "title", "content": "Rate these movies" }
```

| Property  | Required | Values                                                                                                    |
| --------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `style`   | Yes      | `"title"` (max 80 chars), `"body"` (max 160 chars), `"caption"` (max 100 chars), `"label"` (max 40 chars) |
| `content` | Yes      | The text string.                                                                                          |
| `align`   | No       | `"left"` (default), `"center"`, `"right"`                                                                 |

### `image`

Renders an image from a URL.

```json
{ "type": "image", "url": "https://example.com/photo.jpg", "aspect": "16:9" }
```

| Property | Required | Values                                                                 |
| -------- | -------- | ---------------------------------------------------------------------- |
| `url`    | Yes      | HTTPS image URL. Supports jpg, png, gif, webp. GIFs autoplay and loop. |
| `aspect` | Yes      | `"1:1"`, `"16:9"`, `"4:3"`, `"3:4"`, `"9:16"`                          |
| `alt`    | No       | Alt text for accessibility.                                            |

### `video`

Renders a short video clip. Autoplays muted. Tap to unmute. Subsequent taps play/pause the video.

```json
{
  "type": "video",
  "url": "https://example.com/clip.mp4",
  "aspect": "16:9"
}
```

| Property | Required | Values                               |
| -------- | -------- | ------------------------------------ |
| `url`    | Yes      | HTTPS video URL. Supports mp4, webm. |
| `aspect` | Yes      | `"1:1"`, `"16:9"`, `"9:16"`          |
| `alt`    | No       | Alt text for accessibility.          |

### `divider`

A horizontal line to visually separate content sections.

```json
{ "type": "divider" }
```

No additional properties.

### `spacer`

Vertical breathing room. The client determines actual height.

```json
{ "type": "spacer", "size": "medium" }
```

| Property | Required | Values                                     |
| -------- | -------- | ------------------------------------------ |
| `size`   | No       | `"small"`, `"medium"` (default), `"large"` |

### `progress`

A horizontal progress bar.

```json
{ "type": "progress", "value": 72, "max": 100, "label": "72% Yes" }
```

| Property | Required | Values                                                         |
| -------- | -------- | -------------------------------------------------------------- |
| `value`  | Yes      | Number, current value.                                         |
| `max`    | Yes      | Number, maximum value.                                         |
| `label`  | No       | Text label displayed alongside. Max 60 chars.                  |
| `color`  | No       | `"accent"` (default) or any palette color name                 |

### `list`

An ordered or unordered list of items.

```json
{
  "type": "list",
  "style": "ordered",
  "items": [
    { "content": "@dwr.eth", "trailing": "8/10 (80%)" },
    { "content": "@jessepollak", "trailing": "7/10 (70%)" }
  ]
}
```

| Property           | Required | Values                                                                           |
| ------------------ | -------- | -------------------------------------------------------------------------------- |
| `style`            | No       | `"ordered"` (default, numbered), `"unordered"` (bullets), `"plain"` (no markers) |
| `items`            | Yes      | Array of list items. Max 4 items.                                                |
| `items[].content`  | Yes      | Item text. Max 100 chars.                                                        |
| `items[].trailing` | No       | Right-aligned text (for scores, stats). Max 40 chars.                            |

### `grid`

A rows x columns grid of cells. Each cell has a background color and optional text content. For game boards, pixel canvases, and tile-based UIs.

```json
{
  "type": "grid",
  "cols": 5,
  "rows": 6,
  "cells": [
    { "row": 0, "col": 0, "color": "#22C55E", "content": "C" },
    { "row": 0, "col": 1, "color": "#6B7280", "content": "R" }
  ]
}
```

| Property          | Required | Values                                                                                                                                                                                                                                                                                                     |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cols`            | Yes      | Number of columns. Min 2, max 64.                                                                                                                                                                                                                                                                          |
| `rows`            | Yes      | Number of rows. Min 2, max 8.                                                                                                                                                                                                                                                                              |
| `cells`           | Yes      | Array of cell definitions. Only non-empty cells need to be specified.                                                                                                                                                                                                                                      |
| `cells[].row`     | Yes      | Row index (0-based).                                                                                                                                                                                                                                                                                       |
| `cells[].col`     | Yes      | Column index (0-based).                                                                                                                                                                                                                                                                                    |
| `cells[].color`   | No       | 6-digit hex color (`#RRGGBB`) for background. Omit for transparent.                                                                                                                                                                                                                                        |
| `cells[].content` | No       | Text content to display in the cell.                                                                                                                                                                                                                                                                       |
| `cellSize`        | No       | `"auto"` (default, fills available width), `"square"` (cells are square)                                                                                                                                                                                                                                   |
| `gap`             | No       | `"none"`, `"small"` (default), `"medium"`                                                                                                                                                                                                                                                                  |
| `interactive`     | No       | If `true`, cells with no entry in the `cells` array are tappable. Tap coordinates are included in the next POST. Cells with any properties (color, content) are not tappable and are fixed content. This allows games like crosswords to have both interactive empty cells and non-interactive wall cells. |

### `text_input`

A single-line text input field.

```json
{
  "type": "text_input",
  "name": "guess",
  "placeholder": "Type 5-letter word...",
  "maxLength": 5
}
```

| Property      | Required | Values                                   |
| ------------- | -------- | ---------------------------------------- |
| `name`        | Yes      | Field identifier, included in POST data. |
| `placeholder` | No       | Placeholder text. Max 60 chars.          |
| `maxLength`   | No       | Max input length. Max 280 chars.         |

### `slider`

A horizontal slider for numeric input.

```json
{
  "type": "slider",
  "name": "estimate",
  "min": 0,
  "max": 100,
  "step": 1,
  "label": "Your estimate"
}
```

| Property   | Required | Values                                   |
| ---------- | -------- | ---------------------------------------- |
| `name`     | Yes      | Field identifier, included in POST data. |
| `min`      | Yes      | Minimum value (number).                  |
| `max`      | Yes      | Maximum value (number).                  |
| `step`     | No       | Step increment. Default: 1.              |
| `value`    | No       | Initial value. Default: midpoint.        |
| `label`    | No       | Label text. Max 60 chars.                |
| `minLabel` | No       | Label at left end. Max 20 chars.         |
| `maxLabel` | No       | Label at right end. Max 20 chars.        |

### `button_group`

A set of tappable options. User selects one.

```json
{
  "type": "button_group",
  "name": "vote",
  "options": ["Tabs", "Spaces"],
  "style": "row"
}
```

| Property  | Required | Values                                                                                                       |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `name`    | Yes      | Field identifier, included in POST data.                                                                     |
| `options` | Yes      | Array of option strings. Min 2, max 4. Each max 40 chars.                                                    |
| `style`   | No       | `"row"` (side by side, default for 2-3 options), `"stack"` (vertical, default for 4+), `"grid"` (2-col grid) |

### `toggle`

A single on/off toggle.

```json
{
  "type": "toggle",
  "name": "notifications",
  "label": "Enable reminders",
  "value": false
}
```

| Property | Required | Values                                   |
| -------- | -------- | ---------------------------------------- |
| `name`   | Yes      | Field identifier, included in POST data. |
| `label`  | Yes      | Label text. Max 60 chars.                |
| `value`  | No       | Initial state. Default: `false`.         |

### `bar_chart`

A vertical bar chart for displaying labeled values. For poll results, rankings, breakdowns, and distributions.

```json
{
  "type": "bar_chart",
  "bars": [
    { "label": "Anthropic", "value": 21 },
    { "label": "Databricks", "value": 18 },
    { "label": "OpenAI", "value": 10, "color": "teal" }
  ],
  "max": 100
}
```

| Property       | Required | Values                                                                                      |
| -------------- | -------- | ------------------------------------------------------------------------------------------- |
| `bars`         | Yes      | Array of bar objects. Min 1, max 6.                                                         |
| `bars[].label` | Yes      | Bar label text. Max 40 chars.                                                               |
| `bars[].value` | Yes      | Numeric value (>= 0).                                                                       |
| `bars[].color` | No       | Palette color name for this bar. Overrides chart `color`.                                   |
| `max`          | No       | Scale maximum. If omitted, derived from the largest bar value.                              |
| `color`        | No       | Default bar color: `"accent"` (default) or any palette color name                           |

### `group`

Arranges child elements horizontally in a row. For displaying related stats, inputs, or content side by side.

```json
{
  "type": "group",
  "layout": "row",
  "children": [
    { "type": "text", "style": "title", "content": "42" },
    { "type": "text", "style": "caption", "content": "score" }
  ]
}
```

| Property   | Required | Values                                 |
| ---------- | -------- | -------------------------------------- |
| `layout`   | Yes      | `"row"` (horizontal arrangement).      |
| `children` | Yes      | Array of child elements. Min 2, max 3. |

Rules:

- A group counts as 1 element toward the page max of 5.
- No media elements inside groups (`image`, `video`, `grid` are not allowed).
- No nesting: groups cannot contain other groups.
- Children are rendered with equal width, side by side.
- Any non-media element is valid as a child: `text`, `progress`, `list`, `slider`, `button_group`, `toggle`, `text_input`, `divider`, `spacer`, `bar_chart`.

## First Page (Feed Card) Requirements

The first page returned from the snap URL is rendered as the feed card.

In addition to all normal page rules, the first page MUST include:

- At least one `text` element with `style: "title"` or `style: "body"`
- At least one interactive element (`button_group`, `slider`, `text_input`, `toggle`) OR at least one media element (`image`, `video`, or `grid`)

This ensures the feed card always has readable content plus engagement or visual context. A page with only buttons and no content is invalid.

## Buttons

Buttons appear at the bottom of the page, below all elements. Each button performs one action.

```json
{
  "buttons": [
    {
      "label": "Submit",
      "action": "post",
      "target": "https://example.com/submit"
    },
    { "label": "Learn more", "action": "link", "target": "https://example.com" }
  ]
}
```

| Property | Required | Description                                                                                |
| -------- | -------- | ------------------------------------------------------------------------------------------ |
| `label`  | Yes      | Button text. Max 30 chars.                                                                 |
| `action` | Yes      | One of the four action types (see below).                                                  |
| `target` | Yes      | URL or SDK action identifier.                                                              |
| `style`  | No       | `"primary"` (filled, default for first button), `"secondary"` (outlined, default for rest) |

### Target URLs

For `post`, `link`, and `mini_app`, `target` is a normal URL and must use HTTPS in production.

For local development (for example a snap server on your machine, or the emulator hitting `http://localhost:...`), `http://` is valid only when the host is loopback: `localhost`, `127.0.0.1`, or IPv6 loopback (`[::1]` / `::1`). Any other `http://` target is invalid.

For `sdk`, `target` is an SDK action identifier, not an HTTP(S) URL.

### Action Types

#### `post`

Makes a POST request to the target URL. The request body is a **JFS compact string** ([JSON Farcaster Signatures](https://github.com/farcasterxyz/protocol/discussions/208)) whose decoded payload includes all input element values from the current page, the user's FID, and a timestamp. See [Authentication](./SPEC.md#authentication). The response must be a valid page JSON; the client renders it as the next page.

Decoded JFS payload shape (signed inside JFS, not sent as bare JSON):

```json
{
  "fid": 12345,
  "inputs": {
    "guess": "CLASS",
    "vote": "Tabs"
  },
  "button_index": 0,
  "timestamp": 1710864000
}
```

Response: A valid page JSON object.

Timeout: The client waits up to 5 seconds. If the server doesn't respond, the client shows an error state on the current page (not a blank screen). The user can retry.

#### `link`

Opens the target URL in the device's external browser. No request is made to the server. The snap stays in its current state.

#### `mini_app`

Opens the target URL as a Farcaster mini app (slides up from bottom, rendered inside the Farcaster app). The target must be a valid Farcaster mini app URL.

#### `sdk`

Triggers a Farcaster SDK action. The target is an SDK action identifier with parameters. Uses the existing Farcaster SDK action set.

Examples:

```json
{ "label": "View cast", "action": "sdk", "target": "cast:view:0x1234abcd" }
{ "label": "Follow", "action": "sdk", "target": "user:follow:12345" }
{ "label": "Send tip", "action": "sdk", "target": "wallet:send:0x1234:0.01:ETH" }
```

The exact SDK action format follows the existing Farcaster SDK specification.

## Effects

Effects are page-level overlays and do not count toward the 5-element limit.

| Effect     | Behavior                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `confetti` | One-time burst of confetti particles on page load (for celebrations, milestones, and completion states). |

Effects fire once when the page is rendered. They do not repeat on re-renders or refreshes of the same page.

## Theme and Styling

Snaps specify only an accent color. The client handles all other styling, including light/dark mode from app settings.

### Color Palette

All colors in snaps (accent, progress bar, bar chart) are specified as **named palette colors**, not hex values. The client maps each name to a hex value appropriate for its current light/dark mode. This ensures visual consistency across the feed and guarantees readability in both modes.

The palette has 8 colors:

| Name       | Light        | Dark         |
| ---------- | ------------ | ------------ |
| `gray`     | `#8F8F8F`    | `#8F8F8F`    |
| `blue`     | `#006BFF`    | `#006FFE`    |
| `red`      | `#FC0036`    | `#F13342`    |
| `amber`    | `#FFAE00`    | `#FFAE00`    |
| `green`    | `#28A948`    | `#00AC3A`    |
| `teal`     | `#00AC96`    | `#00AA96`    |
| `purple`   | `#8B5CF6`    | `#A78BFA`    |
| `pink`     | `#F32782`    | `#F12B82`    |

The default accent is `purple`.

**Where palette colors are used:**

- `page.theme.accent` — one of the 8 palette names (default: `"purple"`)
- `progress.color` — `"accent"` (uses theme accent) or any palette name
- `bar_chart.color` — `"accent"` or any palette name (default bar fill)
- `bar_chart.bars[].color` — any palette name (per-bar override)

**Exception:** `grid.cells[].color` accepts free hex (`#RRGGBB`). Games and pixel canvases need arbitrary colors for content like Wordle tiles and pixel art.

### Accent Surfaces

- Primary button fill
- Progress bar fill (unless overridden by `color`)
- Slider active track and thumb
- Button group selected option highlight
- Toggle active state fill
- Interactive grid tap highlight

### Snaps Cannot Specify

- Font family, font size, or font weight
- Padding, margins, or spacing
- Border radius, shadows, or decorative styling
- Custom CSS or inline styles
- Background colors on individual elements (except grid cells)
- Element pixel dimensions
- Light/dark mode

## Response Constraints Summary

| Constraint              | Limit                                     |
| ----------------------- | ----------------------------------------- |
| Elements per page       | Max 5                                     |
| Media elements per page | Max 1 (image, video, or grid)             |
| Buttons per page        | Max 4                                     |
| Title text              | Max 80 chars                              |
| Body text               | Max 160 chars                             |
| Caption text            | Max 100 chars                             |
| Label text              | Max 40 chars                              |
| Button label            | Max 30 chars                              |
| Text input max length   | Max 280 chars                             |
| List items              | Max 4                                     |
| Button group options    | Min 2, max 4                              |
| Group children          | Min 2, max 3. No media, no nested groups. |
| Bar chart bars          | Min 1, max 6                              |
| Grid dimensions         | Min 2x2, max 64 cols x 8 rows             |
| POST response timeout   | 5s                                        |
