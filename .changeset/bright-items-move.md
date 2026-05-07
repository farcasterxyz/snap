---
"@farcaster/snap": minor
---

Add shadcn-style media support to Snap `item` rows.

Items now accept an optional `props.media` object that renders in a dedicated left-side media slot while existing `children` continue to render in the right-side actions slot. Icon media uses `{ variant: "icon", name, color? }`; image media uses `{ variant: "image", url, alt?, round? }`, where `round: true` renders avatar-style circular image media.

The React and React Native renderers now support this item media slot, keep media and trailing actions vertically centered in compact rows, use smaller subtitle text for item descriptions, and remove horizontal row padding for plain lists while preserving modest inset for bordered item groups. Image media URLs are validated with the same HTTPS and loopback development rules as regular image elements.

This also adds a runnable `examples/item-media` app with real image media examples and updates the 2.0 item documentation and machine-readable guidance.
