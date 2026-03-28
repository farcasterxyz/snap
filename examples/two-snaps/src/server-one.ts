import { serve } from "@hono/node-server";
import app from "../api/snap-one";

const port = Number(process.env.SNAP_ONE_PORT ?? "3016");

serve({ fetch: app.fetch, port });

console.log(`Snap one — http://localhost:${port}/ (Accept: application/json+farcaster-snap)`);
