import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3016");

serve({ fetch: app.fetch, port });

console.log(`running Version Test snap server on http://localhost:${port}`);
