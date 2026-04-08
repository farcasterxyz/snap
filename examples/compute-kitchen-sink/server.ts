/**
 * Kitchen Sink — exercises every SnapVM feature.
 *
 * Run:   npx tsx examples/compute-kitchen-sink/server.ts
 * Then:  open http://localhost:3000 in the emulator and enter http://localhost:4445
 */
import { compile } from "../../pkgs/snap-compute/src/compiler/index";
import http from "node:http";

const SNAP_SCRIPT = `
// Helper: build a bar chart bar entry
fn make_bar(label: string, value: i64) -> map {
  return { "label": label, "value": value }
}

// Helper: fibonacci (tests recursion + arithmetic)
fn fib(n: i64) -> i64 {
  if n <= 1 {
    return n
  }
  return fib(n - 1) + fib(n - 2)
}

// Helper: string repeat (tests loops + string concat)
fn repeat_str(s: string, n: i64) -> string {
  var result = ""
  var i = 0
  while i < n {
    result = result + s
    i = i + 1
  }
  return result
}

// Helper: count items in array matching a value (tests for-loop + comparison)
fn count_matching(arr: array, target: string) -> i64 {
  var count = 0
  for item in arr {
    if item == target {
      count = count + 1
    }
  }
  return count
}

// Helper: sum an array of numbers
fn sum_array(arr: array) -> i64 {
  var total = 0
  for item in arr {
    total = total + item
  }
  return total
}

export fn main(action: string, inputs: map, button_index: i64) {
  let fid = @self_fid()

  // ── Per-user state ──
  var visits = @state_get("visits") ?? 0
  var last_action = @state_get("last_action") ?? "none"
  var selected_tab = @state_get("tab") ?? "overview"

  // ── Shared state ──
  var total_global_visits = @shared_get("global_visits") ?? 0
  var likes = @shared_get("likes") ?? 0

  // ── Handle interactions ──
  if action == "post" {
    visits = visits + 1
    @state_set("visits", visits)

    total_global_visits = total_global_visits + 1
    @shared_set("global_visits", total_global_visits)

    // Read the tab toggle input (if present)
    let input_tab = inputs["tab"]
    if input_tab != null {
      selected_tab = input_tab
      @state_set("tab", selected_tab)
    }

    // Perform action based on current tab
    var action_id = @state_get("action_id") ?? 0

    if selected_tab == "overview" {
      last_action = "interact"
    }
    if selected_tab == "stats" {
      likes = likes + 1
      @shared_set("likes", likes)
      last_action = "liked"
    }
    if selected_tab == "social" {
      // Rotate through all five social actions
      let social_action = action_id % 5
      if social_action == 0 {
        @emit_cast("Posted from Kitchen Sink snap! Visit #" + to_str(visits), 0, null, null)
        last_action = "emit_cast"
      }
      if social_action == 1 {
        @emit_react(3, null, 1)
        last_action = "emit_react (like)"
      }
      if social_action == 2 {
        @emit_unreact(3, null, 2)
        last_action = "emit_unreact (recast)"
      }
      if social_action == 3 {
        @emit_follow(3)
        last_action = "emit_follow"
      }
      if social_action == 4 {
        @emit_unfollow(3)
        last_action = "emit_unfollow"
      }
      action_id = action_id + 1
      @state_set("action_id", action_id)
    }
    @state_set("last_action", last_action)
  }

  // ── Computed values (tests arithmetic, recursion, loops) ──
  let fib_10 = fib(10)
  let stars = repeat_str("*", visits + 1)

  let sample_data = [10, 20, 30, 40, 50]
  let data_sum = sum_array(sample_data)
  let data_len = 5

  let tags = ["rust", "typescript", "rust", "go", "typescript", "rust"]
  let rust_count = count_matching(tags, "rust")
  let ts_count = count_matching(tags, "typescript")
  let go_count = count_matching(tags, "go")

  // ── Null coalescing chain ──
  let display_name = @state_get("custom_name") ?? @state_get("fallback_name") ?? "FID " + to_str(fid)

  // ── String operations ──
  let greeting = "Hello, " + display_name + "!"
  let visit_label = to_str(visits) + " visit(s)"

  // ── Build UI based on selected tab ──
  var content_children = ["header", "tabs", "action_btn", "separator"]

  if selected_tab == "overview" {
    content_children = ["header", "tabs", "action_btn", "separator", "greeting_text", "visit_info", "fib_info", "stars_text"]
  }
  if selected_tab == "stats" {
    content_children = ["header", "tabs", "action_btn", "separator", "chart", "global_info", "likes_info", "tag_info"]
  }
  if selected_tab == "social" {
    content_children = ["header", "tabs", "action_btn", "separator", "social_header", "social_status"]
  }

  @render({
    "root": "main",
    "elements": {
      "main": {
        "type": "stack",
        "props": { "direction": "vertical", "gap": "md" },
        "children": content_children
      },

      "header": {
        "type": "text",
        "props": { "content": "Kitchen Sink Snap", "size": "md", "weight": "bold" }
      },

      "tabs": {
        "type": "toggle_group",
        "props": {
          "name": "tab",
          "options": ["overview", "stats", "social"],
          "defaultValue": selected_tab
        }
      },
      "action_btn": {
        "type": "button",
        "props": { "label": "Go (" + to_str(visits) + " visits, " + to_str(likes) + " likes)" },
        "on": { "press": { "action": "submit", "params": { "target": "" } } }
      },

      "separator": {
        "type": "separator",
        "props": { "orientation": "horizontal" }
      },

      "greeting_text": {
        "type": "text",
        "props": { "content": greeting }
      },
      "visit_info": {
        "type": "item",
        "props": {
          "title": visit_label,
          "description": "Last action: " + last_action
        }
      },
      "fib_info": {
        "type": "item",
        "props": {
          "title": "fib(10) = " + to_str(fib_10),
          "description": "Computed via recursive function calls"
        }
      },
      "stars_text": {
        "type": "text",
        "props": { "content": "Stars: " + stars, "size": "sm" }
      },


      "chart": {
        "type": "bar_chart",
        "props": {
          "bars": [
            make_bar("Rust", rust_count),
            make_bar("TypeScript", ts_count),
            make_bar("Go", go_count)
          ]
        }
      },
      "global_info": {
        "type": "item",
        "props": {
          "title": "Global visits: " + to_str(total_global_visits),
          "description": "Shared state — visible to all users"
        }
      },
      "likes_info": {
        "type": "item",
        "props": {
          "title": "Total likes: " + to_str(likes),
          "description": "Shared counter via @shared_set"
        }
      },
      "tag_info": {
        "type": "text",
        "props": {
          "content": "Array sum([10,20,30,40,50]) = " + to_str(data_sum) + " | Tags scanned: " + to_str(rust_count + ts_count + go_count) + "/6",
          "size": "sm"
        }
      },

      "social_header": {
        "type": "text",
        "props": { "content": "Message Emission — each click cycles: cast, react, unreact, follow, unfollow", "weight": "bold" }
      },
      "social_status": {
        "type": "item",
        "props": {
          "title": "Last action: " + last_action,
          "description": "Check the exchange log for emitted messages"
        }
      }
    }
  })
}
`;

const bytecode = compile(SNAP_SCRIPT);
const bytecodeBase64 = Buffer.from(bytecode).toString("base64url");
console.log(`Compiled SnapScript to ${bytecode.length} bytes of bytecode`);

const SNAP_MEDIA_TYPE = "application/vnd.farcaster.snap+json";

const snapResponse = JSON.stringify({
  version: "1.1",
  theme: { accent: "teal" },
  compute: {
    bytecode: bytecodeBase64,
    entrypoint: "main",
    gas_limit: 2000000,
    capabilities: ["user_state", "shared_state", "cast", "react", "link"],
  },
  ui: {
    root: "fallback",
    elements: {
      fallback: {
        type: "text",
        props: { content: "This snap requires Snap Compute support." },
      },
    },
  },
});

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url} Accept: ${req.headers.accept}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const accept = req.headers.accept ?? "";
  if (accept.includes(SNAP_MEDIA_TYPE) || accept.includes("application/json")) {
    res.writeHead(200, {
      "Content-Type": `${SNAP_MEDIA_TYPE}; charset=utf-8`,
      Vary: "Accept",
    });
    res.end(snapResponse);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    `<html><body><h1>Kitchen Sink Snap</h1><p>Open this URL in the <a href="http://localhost:3000">Snap Emulator</a>.</p></body></html>`,
  );
});

server.listen(4445, () => {
  console.log("Kitchen Sink snap server running on http://localhost:4445");
});
