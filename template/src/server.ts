import { serve } from "@hono/node-server";
import app from "./index";

/* 
Note: this file is only used for local development.

YOU MUST exclude this file when deploying to host.neynar.app or Vercel.

It imports `@hono/node-server`, a Node-only adapter package that depends on Node APIs and is incompatible with the Vercel Edge runtime.
*/

const port = Number(process.env.PORT ?? "3003");

serve({ fetch: app.fetch, port });

console.log(`Snap template listening on http://localhost:${port}`);
