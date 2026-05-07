import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3022");

serve({ fetch: app.fetch, port });

console.log(`running Cell Grid Square snap server on http://localhost:${port}`);
