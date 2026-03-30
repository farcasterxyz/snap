import { serve } from "@hono/node-server";
import app from "../api/snap-two";

const port = Number(process.env.SNAP_TWO_PORT ?? "3017");

serve({ fetch: app.fetch, port });

console.log(`Snap two — http://localhost:${port}/`);
