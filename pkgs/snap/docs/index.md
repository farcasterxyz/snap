# Snap Spec v1.0

Snaps are interactive feed cards on Farcaster. A snap server returns a JSON response describing a single page of UI. User interactions trigger POST requests back to the server, which returns the next page.

The UI is defined using a [json-render](https://json-render.dev/) spec — a flat element map with typed components, props, and action bindings.

- [Components](./components.md) — 14 UI components (display, layout, fields)
- [Actions](./actions.md) — 9 action types (snap server + client-side)

## Response Format

```json
{
  "version": "1.0",
  "theme": { "accent": "purple" },
  "effects": ["confetti"],
  "spec": {
    "root": "page",
    "elements": {
      "page": { "type": "stack", "props": {}, "children": ["title", "input", "go"] },
      "title": { "type": "item", "props": { "title": "My Snap", "description": "Enter your name" } },
      "input": { "type": "input", "props": { "name": "username", "label": "Name", "placeholder": "you" } },
      "go": {
        "type": "button",
        "props": { "label": "Submit" },
        "on": { "press": { "action": "submit", "params": { "target": "https://my-snap.com/" } } }
      }
    }
  }
}
```

### Top-Level Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `version` | `"1.0"` | Yes | | Spec version |
| `theme` | object | No | `{ accent: "purple" }` | Theme configuration |
| `theme.accent` | PaletteColor | No | `"purple"` | Accent color for buttons, progress bars, etc. |
| `effects` | string[] | No | | Visual effects applied on render |
| `spec` | json-render Spec | Yes | | The UI tree |

**Effects:** `"confetti"`

### The Spec

The `spec` field is a standard [json-render Spec](https://json-render.dev/):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.root` | string | Yes | ID of the root element |
| `spec.elements` | Record<string, UIElement> | Yes | Flat map of all elements by ID |
| `spec.state` | Record<string, unknown> | No | Initial state for the json-render state store |

### Element Structure

Every element in `spec.elements` follows the json-render UIElement shape:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Component name (see [Components](./components.md)) |
| `props` | object | Yes | Component-specific properties (use `{}` if none) |
| `children` | string[] | No | Child element IDs (for containers and action slots) |
| `on` | object | No | Event bindings (see [Actions](./actions.md)) |

### Interaction Flow

1. Client sends GET with `Accept: application/vnd.farcaster.snap+json`
2. Server returns snap response JSON
3. Client renders the spec using the component catalog
4. User interacts with field components (input, slider, switch, toggle_group) — values stored locally
5. User presses a button with `on.press: { action: "submit", params: { target: "..." } }`
6. Client collects all field values and POSTs to `target` with signed payload
7. Server returns next snap response — client renders it

### POST Payload

When `submit` fires, the client sends a JFS-signed envelope containing:

| Field | Type | Description |
|-------|------|-------------|
| `fid` | number | Farcaster user ID |
| `inputs` | Record<string, value> | Collected field values keyed by `name` |
| `button_index` | number | Button index (0) |
| `timestamp` | number | Unix timestamp in seconds |

Input values by field type:
- `input` — string
- `slider` — number
- `switch` — boolean
- `toggle_group` (single) — string
- `toggle_group` (multiple) — string[]

## Color Palette

Named colors used by `theme.accent`, `badge.color`, and `icon.color`. The client maps these to hex values for its current appearance mode.

| Color | Light | Dark |
|-------|-------|------|
| `accent` | theme accent color | theme accent color |
| `gray` | #8F8F8F | #8F8F8F |
| `blue` | #006BFF | #006FFE |
| `red` | #FC0036 | #F13342 |
| `amber` | #FFAE00 | #FFAE00 |
| `green` | #28A948 | #00AC3A |
| `teal` | #00AC96 | #00AA96 |
| `purple` | #8B5CF6 | #A78BFA |
| `pink` | #F32782 | #F12B82 |

## Icon Set

34 curated icons from [Lucide](https://lucide.dev/). Used by `icon.name`, `button.icon`, and `badge.icon`.

| Category | Icons |
|----------|-------|
| Navigation | `arrow-right`, `arrow-left`, `external-link`, `chevron-right` |
| Status | `check`, `x`, `alert-triangle`, `info`, `clock` |
| Social | `heart`, `message-circle`, `repeat`, `share`, `user`, `users` |
| Content | `star`, `trophy`, `zap`, `flame`, `gift` |
| Media | `image`, `play`, `pause` |
| Commerce | `wallet`, `coins` |
| Actions | `plus`, `minus`, `refresh-cw`, `bookmark` |
| Feedback | `thumbs-up`, `thumbs-down`, `trending-up`, `trending-down` |

## Content Type

Snap responses use the media type:

```
application/vnd.farcaster.snap+json
```
