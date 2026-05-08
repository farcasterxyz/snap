import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3023");

serve({ fetch: app.fetch, port });

console.log(`running Cell Grid Text Color snap server on http://localhost:${port}`);
