---
"@farcaster/snap": minor
---

feat(cell_grid): add `on.tap` event so a single tap can fire an action (e.g. `submit`) without requiring a separate button. The latest selection is written to `inputs[name]` before the bound action runs, so the POST body includes the just-tapped cell. `select: "single"` is the natural fit for tap-to-submit; `select: "multiple"` can still pair with a separate submit button when the user should choose multiple cells before posting.
