import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3020");

serve({ fetch: app.fetch, port });

console.log(`running Snap Catalog on http://localhost:${port}`);
