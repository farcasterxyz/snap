/**
 * Example compute snap server.
 *
 * Run:   npx tsx examples/compute-hello/server.ts
 * Then:  open http://localhost:3000 in the emulator and enter http://localhost:4444
 */
import { compile } from "../../pkgs/snap-compute/src/compiler/index.js";
import http from "node:http";

const SNAP_SCRIPT = `
export fn main(action: string, inputs: map, button_index: i64) {
  let fid = @self_fid()
  var visits = @state_get("visits") ?? 0

  if action == "post" {
    visits = visits + 1
    @state_set("visits", visits)
  }

  let greeting = "Hello, FID " + to_str(fid) + "!"
  let visit_text = "You have visited " + to_str(visits) + " time(s)."

  var btn_label = "Click me!"
  if visits > 0 {
    btn_label = "Clicked " + to_str(visits) + "x - click again!"
  }

  @render({
    "root": "main",
    "elements": {
      "main": {
        "type": "stack",
        "props": { "direction": "vertical", "gap": "md" },
        "children": ["title", "visits", "btn"]
      },
      "title": {
        "type": "text",
        "props": { "content": greeting, "size": "md", "weight": "bold" }
      },
      "visits": {
        "type": "text",
        "props": { "content": visit_text, "size": "sm" }
      },
      "btn": {
        "type": "button",
        "props": { "label": btn_label },
        "on": { "press": { "action": "submit", "params": { "target": "" } } }
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
  theme: { accent: "purple" },
  compute: {
    bytecode: bytecodeBase64,
    entrypoint: "main",
    gas_limit: 500000,
    capabilities: ["user_state"],
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
    `<html><body><h1>Compute Snap</h1><p>Open this URL in the <a href="http://localhost:3000">Snap Emulator</a>.</p></body></html>`,
  );
});

server.listen(4444, () => {
  console.log("Compute snap server running on http://localhost:4444");
});
