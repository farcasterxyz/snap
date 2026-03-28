import { handle } from "hono/vercel";
import app from "../src/app.js";

export const runtime = "edge";
export const GET = handle(app);
export const POST = handle(app);
