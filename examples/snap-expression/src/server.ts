import { serve } from "@hono/node-server";
import app from "../api";

const port = Number(process.env.PORT ?? "3013");

serve({ fetch: app.fetch, port });

console.log(`running snap-expression server on http://localhost:${port}`);
console.log(`  /ceo-spectrum → CEO Peacetime/Wartime snap`);
console.log(`  /vcx-explorer → VCX Fund Explorer snap`);
