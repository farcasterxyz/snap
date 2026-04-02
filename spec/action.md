# Actions

> Part of the [Farcaster Snaps spec](./SPEC.md) (draft).

Buttons in a snap page trigger actions. There are four button action types: `post`, `link`, `mini_app`, and `client`.

## `post`

Makes a POST request to the target URL. The request body is a **JFS compact string** ([JSON Farcaster Signatures](https://github.com/farcasterxyz/protocol/discussions/208)) whose decoded payload includes all input element values from the current page, the user's FID, and a timestamp. See [Authentication](./auth.md).

The response must be a valid page JSON; the client renders it as the next page.

**Timeout:** The client waits up to 5 seconds. If the server doesn't respond, the client shows an error state on the current page. The user can retry.

### Input Data in POST Requests

When a button with `action: "post"` is tapped, the client collects values from all input elements on the current page and includes them in the POST body.

| Element Type         | Data Included                            |
| -------------------- | ---------------------------------------- |
| `text_input`         | `{ "name": "string value" }`             |
| `slider`             | `{ "name": numeric_value }`              |
| `button_group`       | `{ "name": "selected option string" }`   |
| `toggle`             | `{ "name": true/false }`                 |
| `grid` (interactive) | `{ "grid_tap": { "row": N, "col": N } }` |

Input elements without a user interaction are included with their default/initial values.

## `link`

Opens the target URL in the device's external browser. No request is made to the server. The snap stays in its current state.

## `mini_app`

Opens the target URL as a Farcaster mini app (slides up from bottom, rendered inside the Farcaster app). The target must be a valid Farcaster mini app URL.

## `client`

Triggers an action in the Farcaster client. Instead of a `target` URL, `client` buttons include a `client_action` object that specifies the action type and its parameters.

```json
{
  "label": "View cast",
  "action": "client",
  "client_action": { "type": "view_cast", "hash": "0x1234abcd" }
}
```

### Client Action Types

#### `view_cast`

Opens a cast in the Farcaster client.

| Property | Required | Description |
| -------- | -------- | ----------- |
| `type`   | Yes      | `"view_cast"` |
| `hash`   | Yes      | Cast hash |

```json
{ "type": "view_cast", "hash": "0x1234abcd" }
```

#### `view_profile`

Opens a user's Farcaster profile.

| Property | Required | Description |
| -------- | -------- | ----------- |
| `type`   | Yes      | `"view_profile"` |
| `fid`    | Yes      | Farcaster user ID |

```json
{ "type": "view_profile", "fid": 6841 }
```

#### `compose_cast`

Opens the cast composer with optional pre-filled content. The user can edit before posting.

| Property     | Required | Description |
| ------------ | -------- | ----------- |
| `type`       | Yes      | `"compose_cast"` |
| `text`       | No       | Suggested body text |
| `embeds`     | No       | Array of up to 2 embed URLs |
| `parent`     | No       | Reply target: `{ "type": "cast", "hash": "0x..." }` |
| `channelKey` | No       | Post to a specific channel |

```json
{
  "type": "compose_cast",
  "text": "Check out this snap!",
  "embeds": ["https://example.com"],
  "channelKey": "farcaster"
}
```

#### `view_token`

Displays a token in the Farcaster client.

| Property | Required | Description |
| -------- | -------- | ----------- |
| `type`   | Yes      | `"view_token"` |
| `token`  | Yes      | CAIP-19 asset ID (e.g. `"eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"`) |

```json
{ "type": "view_token", "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }
```

#### `send_token`

Opens the send form, optionally pre-filled with token, amount, and recipient.

| Property           | Required | Description |
| ------------------ | -------- | ----------- |
| `type`             | Yes      | `"send_token"` |
| `token`            | No       | CAIP-19 asset ID |
| `amount`           | No       | Amount in raw token units (e.g. `"1000000"` for 1 USDC) |
| `recipientFid`     | No       | Farcaster user ID of recipient |
| `recipientAddress` | No       | Wallet address of recipient |

```json
{ "type": "send_token", "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "amount": "1000000", "recipientFid": 3 }
```

#### `swap_token`

Opens the swap form, optionally pre-filled with tokens and amount.

| Property     | Required | Description |
| ------------ | -------- | ----------- |
| `type`       | Yes      | `"swap_token"` |
| `sellToken`  | No       | CAIP-19 asset ID to sell |
| `buyToken`   | No       | CAIP-19 asset ID to buy |
| `sellAmount` | No       | Amount in raw token units |

```json
{ "type": "swap_token", "sellToken": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "buyToken": "eip155:8453/erc20:0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" }
```
