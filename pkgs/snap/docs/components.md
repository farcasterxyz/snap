# Components

14 components organized into three categories:

| # | Component | Category | Description |
|---|-----------|----------|-------------|
| 1 | [badge](#badge) | Display | Inline label with color and icon |
| 2 | [button](#button) | Display | Action button with variants and icon |
| 3 | [icon](#icon) | Display | Standalone icon from curated set |
| 4 | [image](#image) | Display | HTTPS image with aspect ratio |
| 5 | [item](#item) | Display | Content row with actions slot |
| 6 | [item_group](#item_group) | Container | Groups items into a styled list |
| 7 | [progress](#progress) | Display | Horizontal progress bar |
| 8 | [separator](#separator) | Display | Visual divider |
| 9 | [stack](#stack) | Container | Vertical or horizontal layout |
| 10 | [text](#text) | Display | Text block with size and weight |
| 11 | [input](#input) | Field | Text or number input |
| 12 | [slider](#slider) | Field | Numeric range slider |
| 13 | [switch](#switch) | Field | Boolean toggle |
| 14 | [toggle_group](#toggle_group) | Field | Single or multi-select choice group |

**Field components** collect user input. Their values are sent in the POST payload under `inputs[name]` when a `submit` action fires.

---

## badge

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/badge)

Inline label with color and optional icon. Use for tags, status indicators, counts.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `label` | string | Yes | | min 1, max 30 chars | Display text |
| `color` | PaletteColor | No | `"accent"` | See [color palette](./index.md#color-palette) | Background color |
| `icon` | IconName | No | | See [icon set](./index.md#icon-set) | Leading icon |

### Examples

```json
{ "type": "badge", "props": { "label": "New" } }
```

```json
{ "type": "badge", "props": { "label": "Live", "color": "green", "icon": "zap" } }
```

```json
{ "type": "badge", "props": { "label": "3 errors", "color": "red", "icon": "alert-triangle" } }
```

---

## button

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/button)

Action button. Bind actions using the `on.press` event. See [Actions](./actions.md).

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `label` | string | Yes | | min 1, max 30 chars | Button text |
| `variant` | string | No | `"default"` | See variants | Visual style |
| `icon` | IconName | No | | See [icon set](./index.md#icon-set) | Leading icon |

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Solid accent background, white text — primary CTA |
| `secondary` | Accent-colored border, transparent fill |
| `outline` | Light border, transparent fill |
| `ghost` | No border, no background — text only |

### Examples

```json
{
  "type": "button",
  "props": { "label": "Submit" },
  "on": { "press": { "action": "submit", "params": { "target": "https://my-snap.com/" } } }
}
```

```json
{
  "type": "button",
  "props": { "label": "View Cast", "variant": "outline", "icon": "external-link" },
  "on": { "press": { "action": "view_cast", "params": { "hash": "0xabc123" } } }
}
```

```json
{
  "type": "button",
  "props": { "label": "Open", "variant": "ghost", "icon": "arrow-right" },
  "on": { "press": { "action": "open_url", "params": { "target": "https://farcaster.xyz" } } }
}
```

---

## icon

[Lucide icons reference](https://lucide.dev/icons/)

Standalone icon from the curated set. Useful inside item action slots, horizontal stacks, or anywhere you need a visual indicator.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `name` | IconName | Yes | | See available icons | Icon identifier |
| `color` | PaletteColor | No | `"accent"` | See [color palette](./index.md#color-palette) | Icon color |
| `size` | string | No | `"md"` | `"sm"` (16px) or `"md"` (20px) | Icon size |

### Available Icons

**Navigation**
`arrow-right` `arrow-left` `external-link` `chevron-right`

**Status**
`check` `x` `alert-triangle` `info` `clock`

**Social**
`heart` `message-circle` `repeat` `share` `user` `users`

**Content**
`star` `trophy` `zap` `flame` `gift`

**Media**
`image` `play` `pause`

**Commerce**
`wallet` `coins`

**Actions**
`plus` `minus` `refresh-cw` `bookmark`

**Feedback**
`thumbs-up` `thumbs-down` `trending-up` `trending-down`

### Examples

```json
{ "type": "icon", "props": { "name": "star", "color": "amber" } }
```

```json
{ "type": "icon", "props": { "name": "check", "color": "green", "size": "sm" } }
```

---

## image

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/aspect-ratio)

HTTPS image with fixed aspect ratio.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `url` | string | Yes | | HTTPS URL, .jpg/.png/.gif/.webp | Image URL |
| `aspect` | string | Yes | | `"1:1"` `"16:9"` `"4:3"` `"3:4"` `"9:16"` | Aspect ratio |
| `alt` | string | No | | | Alt text for accessibility |

### Examples

```json
{ "type": "image", "props": { "url": "https://example.com/photo.jpg", "aspect": "16:9" } }
```

```json
{ "type": "image", "props": { "url": "https://example.com/avatar.png", "aspect": "1:1", "alt": "User avatar" } }
```

---

## item

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/item)

Content row with title, optional description, and an actions slot on the right side. The primary component for displaying structured content.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `title` | string | Yes | | min 1, max 100 chars | Primary text |
| `description` | string | No | | max 160 chars | Secondary text below title |
| `variant` | string | No | `"default"` | See variants | Visual style |

### Variants

| Variant | Description |
|---------|-------------|
| `default` | No background, no border |
| `outline` | Bordered with padding |
| `muted` | Subtle gray background with padding |

### Children

Rendered in the **actions slot** (right side of the item). Use for badges, icons, buttons, or any trailing content.

### Examples

Item with badge in actions slot:

```json
"score": {
  "type": "item",
  "props": { "title": "Engagement Score", "description": "Based on 24h activity" },
  "children": ["score-badge"]
},
"score-badge": { "type": "badge", "props": { "label": "92", "color": "green" } }
```

Item with icon in actions slot:

```json
"nav": {
  "type": "item",
  "props": { "title": "Settings", "variant": "outline" },
  "children": ["nav-arrow"]
},
"nav-arrow": { "type": "icon", "props": { "name": "chevron-right", "color": "gray" } }
```

---

## item_group

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/item) (see ItemGroup)

Groups item children into a styled list with consistent spacing. The client may render separators between items automatically.

### Children

`item` elements.

### Example

```json
"results": {
  "type": "item_group",
  "props": {},
  "children": ["r1", "r2", "r3"]
},
"r1": { "type": "item", "props": { "title": "First place", "description": "Alice" } },
"r2": { "type": "item", "props": { "title": "Second place", "description": "Bob" } },
"r3": { "type": "item", "props": { "title": "Third place", "description": "Charlie" } }
```

---

## progress

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/progress)

Horizontal progress bar. Always uses the theme accent color.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `value` | number | Yes | | 0 to max, finite | Current value |
| `max` | number | Yes | | > 0, finite | Maximum value |
| `label` | string | No | | max 60 chars | Label text above the bar |

### Validation

- `max` must be a finite number greater than 0
- `value` must be a finite number between 0 and `max`

### Examples

```json
{ "type": "progress", "props": { "value": 65, "max": 100, "label": "Upload progress" } }
```

```json
{ "type": "progress", "props": { "value": 3, "max": 10 } }
```

---

## separator

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/separator)

Visual divider between content sections.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `orientation` | string | No | `"horizontal"` | `"horizontal"` or `"vertical"` | Divider direction |

### Examples

```json
{ "type": "separator", "props": {} }
```

```json
{ "type": "separator", "props": { "orientation": "vertical" } }
```

---

## stack

No direct shadcn equivalent — standard flex layout container.

Layout container for arranging children vertically or horizontally. The page root element is typically a vertical stack.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `direction` | string | No | `"vertical"` | `"vertical"` or `"horizontal"` | Layout direction |
| `gap` | string | No | `"md"` | See gap values | Spacing between children |

### Gap Values

| Gap | Description |
|-----|-------------|
| `"none"` | No spacing |
| `"sm"` | Small spacing |
| `"md"` | Medium spacing (default) |
| `"lg"` | Large spacing |

### Children

Any elements.

### Examples

```json
"page": {
  "type": "stack",
  "props": {},
  "children": ["header", "content", "actions"]
}
```

```json
"row": {
  "type": "stack",
  "props": { "direction": "horizontal", "gap": "sm" },
  "children": ["b1", "b2", "b3"]
}
```

---

## text

No direct shadcn equivalent — standard typography primitive.

Text block for headings, body copy, and captions.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `content` | string | Yes | | min 1, max 320 chars | Text content |
| `size` | string | No | `"md"` | See sizes | Text size |
| `weight` | string | No | varies by size | See weights | Font weight |
| `align` | string | No | `"left"` | `"left"`, `"center"`, `"right"` | Text alignment |

### Sizes

| Size | Use Case | Default Weight |
|------|----------|---------------|
| `"lg"` | Heading | `"bold"` |
| `"md"` | Body text | `"normal"` |
| `"sm"` | Caption, metadata | `"normal"` |

### Weights

`"bold"`, `"medium"`, `"normal"`

### Examples

```json
{ "type": "text", "props": { "content": "Welcome to Snaps", "size": "lg" } }
```

```json
{ "type": "text", "props": { "content": "Snaps are interactive feed cards driven by your JSON." } }
```

```json
{ "type": "text", "props": { "content": "Last updated 2 hours ago", "size": "sm", "align": "center" } }
```

---

## input

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/input)

Text or number input field. Value is collected in POST inputs under `name`.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `name` | string | Yes | | min 1 char | Input name (becomes POST inputs key) |
| `type` | string | No | `"text"` | `"text"` or `"number"` | Input type (affects mobile keyboard) |
| `label` | string | No | | max 60 chars | Label text above input |
| `placeholder` | string | No | | max 60 chars | Placeholder text |
| `defaultValue` | string | No | | | Pre-filled value |
| `maxLength` | number | No | | 1 to 280 | Maximum character count |

### POST Value

String.

### Examples

```json
{ "type": "input", "props": { "name": "email", "label": "Email", "placeholder": "you@example.com" } }
```

```json
{ "type": "input", "props": { "name": "amount", "type": "number", "label": "Amount", "placeholder": "0.00" } }
```

```json
{ "type": "input", "props": { "name": "bio", "label": "Bio", "defaultValue": "Hello world", "maxLength": 160 } }
```

---

## slider

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/slider)

Numeric range slider. Value is collected in POST inputs under `name`.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `name` | string | Yes | | min 1 char | Slider name (becomes POST inputs key) |
| `label` | string | No | | max 60 chars | Label text above slider |
| `min` | number | Yes | | must be <= max | Minimum value |
| `max` | number | Yes | | must be >= min | Maximum value |
| `step` | number | No | `1` | must be > 0, finite | Increment step |
| `defaultValue` | number | No | midpoint of min/max | must be between min and max | Initial value |

### Validation

- `min` must be less than or equal to `max`
- `step` must be a finite number greater than 0
- `defaultValue` must be between `min` and `max`

### POST Value

Number.

### Examples

```json
{ "type": "slider", "props": { "name": "rating", "label": "Rating (1-10)", "min": 1, "max": 10 } }
```

```json
{ "type": "slider", "props": { "name": "amount", "min": 0, "max": 1000, "step": 50, "defaultValue": 200 } }
```

---

## switch

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/switch)

Boolean toggle. Value is collected in POST inputs under `name`.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `name` | string | Yes | | min 1 char | Switch name (becomes POST inputs key) |
| `label` | string | No | | max 60 chars | Label text beside the switch |
| `defaultChecked` | boolean | No | `false` | | Initial checked state |

### POST Value

Boolean (`true` or `false`).

### Examples

```json
{ "type": "switch", "props": { "name": "notifications", "label": "Enable notifications" } }
```

```json
{ "type": "switch", "props": { "name": "darkMode", "label": "Dark mode", "defaultChecked": true } }
```

---

## toggle_group

[shadcn/ui reference](https://ui.shadcn.com/docs/components/base/toggle-group)

Single or multi-select choice group. Value is collected in POST inputs under `name`.

### Props

| Prop | Type | Required | Default | Constraints | Description |
|------|------|----------|---------|-------------|-------------|
| `name` | string | Yes | | min 1 char | Group name (becomes POST inputs key) |
| `label` | string | No | | max 60 chars | Label text above the group |
| `multiple` | boolean | No | `false` | | Allow multiple selections |
| `orientation` | string | No | `"horizontal"` | `"horizontal"` or `"vertical"` | Button layout direction |
| `defaultValue` | string or string[] | No | | must match option values | Pre-selected option(s) |
| `options` | string[] | Yes | | min 2, max 6 items, each max 30 chars | Choice labels |
| `variant` | string | No | `"default"` | See variants | Visual style |

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Solid toggle buttons |
| `outline` | Bordered toggle buttons |

### POST Value

- When `multiple` is `false`: the selected option string
- When `multiple` is `true`: an array of selected option strings

### Examples

```json
{ "type": "toggle_group", "props": { "name": "plan", "label": "Choose a plan", "options": ["Free", "Pro", "Team"] } }
```

```json
{
  "type": "toggle_group",
  "props": {
    "name": "interests",
    "label": "Select interests",
    "multiple": true,
    "orientation": "vertical",
    "options": ["Dev", "Design", "Data", "Product"]
  }
}
```

```json
{ "type": "toggle_group", "props": { "name": "size", "options": ["S", "M", "L", "XL"], "defaultValue": "M" } }
```
