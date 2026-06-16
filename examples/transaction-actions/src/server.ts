import { serve } from "@hono/node-server";
import app from "./index";

const port = Number(process.env.PORT ?? "3026");

serve({ fetch: app.fetch, port });

console.log(
  `running Transaction Actions snap server on http://localhost:${port}`
);
