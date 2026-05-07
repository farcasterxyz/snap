---
"@farcaster/snap": minor
---

Add shadcn-style media support to Snap `item` rows.

Items now accept an optional `props.media` object that renders in a dedicated left-side media slot while existing `children` continue to render in the right-side actions slot. Icon media uses `{ variant: "icon", name, color? }`; image media uses `{ variant: "image", url, alt?, round? }`, where `round: true` renders avatar-style circular image media.

The snap UI catalog now exposes the expanded `item` schema through `itemProps` and `itemMediaProps`, including the new discriminated `media` contract. The catalog keeps `variant` limited to `"default"` and does not add item sizes or media sizes, so clients continue to own the exact rendered dimensions. Catalog validation accepts icon media by `name` plus optional palette `color`, accepts image media by `url` plus optional `alt` and `round`, and rejects unsupported media fields.

The React and React Native renderers now support this item media slot, keep media and trailing actions vertically centered in compact rows, use smaller subtitle text for item descriptions, and remove horizontal row padding for plain lists while preserving modest inset for bordered item groups. Image media URLs are validated with the same HTTPS and loopback development rules as regular image elements.

This also adds a runnable `examples/item-media` app with real image media examples and updates the 2.0 item documentation and machine-readable guidance.
