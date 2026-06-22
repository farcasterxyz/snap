---
"@farcaster/snap": minor
---

Add wallet transaction feedback support for Snaps.

This release adds a typed `transaction_result` callback payload so hosts can report wallet transaction success or failure back to Snap servers after a `send_transaction` action. `parseRequest` now recognizes the callback shape and exposes the original transaction request plus either a success transaction hash or structured failure details.

It also adds bindable action activity state for async Snap actions. React and React Native presenters write pending state to `/actions/<activityKey>/pending`, with `activityKey` coming from action params when provided, so Snap authors can bind UI such as `button.props.disabled` to in-flight wallet actions.

While an async action is pending, the renderers block the Snap interaction surface. On web, Snap cards also show the loading overlay over the whole card instead of only disabling the pressed button.
