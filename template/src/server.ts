import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT ?? "3003");

serve({ fetch: app.fetch, port });

console.log(`Snap template listening on http://localhost:${port}`);
