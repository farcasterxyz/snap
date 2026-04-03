# Actions

Actions are bound to elements via the `on` field. Buttons use `on.press` to trigger actions when clicked.

```json
"my-button": {
  "type": "button",
  "props": { "label": "Go" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.com/" }
    }
  }
}
```

There are two categories of actions:

- **Snap actions** — handled by the snap runtime (server round-trips, navigation)
- **Client actions** — executed by the consuming app (Warpcast, emulator, third-party)

| # | Action | Category | Description |
|---|--------|----------|-------------|
| 1 | [submit](#submit) | Snap | POST to server, get next page |
| 2 | [open_url](#open_url) | Snap | Open URL in browser |
| 3 | [open_mini_app](#open_mini_app) | Snap | Launch mini app |
| 4 | [view_cast](#view_cast) | Client | Navigate to a cast |
| 5 | [view_profile](#view_profile) | Client | Navigate to a profile |
| 6 | [compose_cast](#compose_cast) | Client | Open cast composer |
| 7 | [view_token](#view_token) | Client | View token in wallet |
| 8 | [send_token](#send_token) | Client | Open send token flow |
| 9 | [swap_token](#swap_token) | Client | Open swap token flow |

---

## Snap Actions

These are handled by the snap runtime. The snap server defines the intent, and the client infrastructure executes it.

### submit

POST to the snap server with a signed payload containing the user's FID, all collected field input values, and a timestamp. The server returns the next snap page.

This is the primary interaction mechanism — how snaps navigate between pages.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | string | Yes | URL to POST to (HTTPS, or http://localhost for dev) |

**What gets sent:**

The client collects all field component values (input, slider, switch, toggle_group) and sends them in the POST body as `inputs`:

```json
{
  "fid": 12345,
  "inputs": {
    "username": "alice",
    "rating": 7,
    "notifications": true,
    "plan": "Pro"
  },
  "button_index": 0,
  "timestamp": 1717200000
}
```

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Submit" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.com/api/vote" }
    }
  }
}
```

---

### open_url

Open a URL in the system browser. No server round-trip. No input collection.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | string | Yes | URL to open |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Learn More", "variant": "outline", "icon": "external-link" },
  "on": {
    "press": {
      "action": "open_url",
      "params": { "target": "https://docs.farcaster.xyz/snaps" }
    }
  }
}
```

---

### open_mini_app

Open a URL as an in-app Farcaster mini app.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | string | Yes | Mini app URL |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Open App", "icon": "arrow-right" },
  "on": {
    "press": {
      "action": "open_mini_app",
      "params": { "target": "https://my-miniapp.com" }
    }
  }
}
```

---

## Client Actions

These are executed by the consuming app. The snap server declares the intent in the spec; the client decides how to fulfill it. Different clients may implement these differently — Warpcast opens native views, a web client navigates to URLs, the emulator logs to console.

If a client doesn't support a particular client action, it should fail gracefully (e.g. show a message, not crash).

### view_cast

Navigate to a cast by its hash.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `hash` | string | Yes | Cast hash (e.g. `"0xabc123..."`) |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "View Cast", "variant": "outline" },
  "on": {
    "press": {
      "action": "view_cast",
      "params": { "hash": "0x0000000000000000000000000000000000000001" }
    }
  }
}
```

---

### view_profile

Navigate to a Farcaster user's profile.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fid` | number | Yes | Farcaster user ID |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "View Profile", "icon": "user" },
  "on": {
    "press": {
      "action": "view_profile",
      "params": { "fid": 3 }
    }
  }
}
```

---

### compose_cast

Open the cast composer with optional pre-filled content.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | No | Pre-filled cast text |
| `channelKey` | string | No | Target channel key |
| `embeds` | string[] | No | URLs to embed in the cast |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Share", "icon": "share" },
  "on": {
    "press": {
      "action": "compose_cast",
      "params": {
        "text": "Check out this snap!",
        "embeds": ["https://my-snap.com"]
      }
    }
  }
}
```

---

### view_token

View a token in the wallet. The token is identified by a [CAIP-19](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md) asset identifier.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | CAIP-19 token identifier |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "View Token", "icon": "wallet" },
  "on": {
    "press": {
      "action": "view_token",
      "params": { "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }
    }
  }
}
```

---

### send_token

Open the send flow for a token.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | CAIP-19 token identifier |
| `amount` | string | No | Pre-filled amount |
| `recipientFid` | number | No | Recipient identified by FID |
| `recipientAddress` | string | No | Recipient identified by address |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Send USDC", "icon": "coins" },
  "on": {
    "press": {
      "action": "send_token",
      "params": {
        "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "amount": "10.00",
        "recipientFid": 3
      }
    }
  }
}
```

---

### swap_token

Open the swap flow between two tokens.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `sellToken` | string | No | CAIP-19 identifier for the token to sell |
| `buyToken` | string | No | CAIP-19 identifier for the token to buy |

**Example:**

```json
{
  "type": "button",
  "props": { "label": "Swap to USDC", "icon": "refresh-cw" },
  "on": {
    "press": {
      "action": "swap_token",
      "params": {
        "sellToken": "eip155:8453/slip44:60",
        "buyToken": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      }
    }
  }
}
```
