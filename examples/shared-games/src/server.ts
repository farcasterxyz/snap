import { serve } from "@hono/node-server";
import app from "../api";

const port = Number(process.env.PORT ?? "3011");

serve({ fetch: app.fetch, port });

console.log(`Running Shared Games snap server on http://localhost:${port}`);
