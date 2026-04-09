---
"@farcaster/snap": minor
---

Add `open_snap` action for opening snap URLs inline. Unlike `open_url` which opens an external browser, `open_snap` tells the client to render the target as a snap. Removes undocumented `isSnap` param from `open_url`. Buttons with `open_url` now always show the external link icon.
