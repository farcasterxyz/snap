---
"@farcaster/snap": minor
---

feat(cell_grid): add `on.press` so a single press can fire an action (e.g. `submit`) without requiring a separate button. Two interaction modes, mutually exclusive: leave `select: "off"` (default) and bind `on.press` for press-to-act — `inputs[name]` is set to `"row,col"` before the action runs, so the POST body identifies the pressed cell; OR set `select: "single"` / `"multiple"` for press-to-select with a visual ring and pair with a separate submit `button`. `on.press` is ignored whenever `select` is on. Event name matches `button.on.press` for consistency.
