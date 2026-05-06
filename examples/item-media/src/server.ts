import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3021");

serve({ fetch: app.fetch, port });

console.log(`running Item Media snap server on http://localhost:${port}`);
