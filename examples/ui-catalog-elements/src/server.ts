import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT ?? "3015");

serve({ fetch: app.fetch, port });

console.log(
  `Running UI catalog elements snap server on http://localhost:${port}`,
);
