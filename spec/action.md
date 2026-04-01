# Actions

> Part of the [Farcaster Snaps spec](./SPEC.md) (draft).

## Input Data in POST Requests

When a button with `action: "post"` is tapped, the client collects values from all input elements on the current page and includes them in the POST body.

| Element Type         | Data Included                            |
| -------------------- | ---------------------------------------- |
| `text_input`         | `{ "name": "string value" }`             |
| `slider`             | `{ "name": numeric_value }`              |
| `button_group`       | `{ "name": "selected option string" }`   |
| `toggle`             | `{ "name": true/false }`                 |
| `grid` (interactive) | `{ "grid_tap": { "row": N, "col": N } }` |

Input elements without a user interaction are included with their default/initial values.
