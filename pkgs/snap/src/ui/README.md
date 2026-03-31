# Theme colors in `@farcaster/snap/ui`

This document explains how colors flow through snap pages — from the snap JSON spec to what clients render.

## Named palette

Snaps use a fixed set of named colors called the **palette**:

| Name     | Light hex | Dark hex  |
| -------- | --------- | --------- |
| `gray`   | `#8F8F8F` | `#8F8F8F` |
| `blue`   | `#006BFF` | `#006FFE` |
| `red`    | `#FC0036` | `#F13342` |
| `amber`  | `#FFAE00` | `#FFAE00` |
| `green`  | `#28A948` | `#00AC3A` |
| `teal`   | `#00AC96` | `#00AA96` |
| `purple` | `#8B5CF6` | `#A78BFA` |
| `pink`   | `#F32782` | `#F12B82` |

These are exported from `@farcaster/snap` as `PALETTE_LIGHT_HEX`, `PALETTE_DARK_HEX`, and the `PaletteColor` type. Clients resolve the correct hex for their current light/dark mode.

## Page-level accent (`page.theme.accent`)

A snap page may declare a single accent color for the whole page:

```json
{
  "page": {
    "theme": { "accent": "blue" }
  }
}
```

`accent` must be a `PaletteColor` name. When `theme` is omitted, schema validation defaults it to `"purple"` (`DEFAULT_THEME_ACCENT`).

The accent is the color used for all components on the page that don't have an explicit color set.

## Per-element explicit colors

Some elements accept a `color` prop:

- `progress` — color name or `"accent"`
- `bar_chart` — color name or `"accent"` at chart level; color name only per-bar
- `grid` cells — `#rrggbb` hex

When `color` is `"accent"` (or omitted), the element uses the accent color. When it is a specific color name or hex value, that color is **explicit** and independent of `page.theme.accent`.

## Light/dark mode

Mode is determined by the **client**, not by snap JSON. Snap JSON carries no light/dark setting. Clients select `PALETTE_LIGHT_HEX` or `PALETTE_DARK_HEX` based on their current mode.
