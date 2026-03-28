import { serve } from "@hono/node-server";
import app from "../api";

const port = Number(process.env.PORT ?? "3014");

serve({ fetch: app.fetch, port });

console.log(`running Current Time snap server on http://localhost:${port}`);
