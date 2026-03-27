import { describe, it } from "vitest";
import { rootSchema } from "../src/schemas";

describe("debug", () => {
  it("log issues — missing type", () => {
    const r = rootSchema.safeParse({
      version: "1.0",
      page: { elements: [{ content: "hello" }] },
    });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r.success ? "ok" : r.error.issues, null, 2));
    const r2 = rootSchema.safeParse({
      version: "1.0",
      page: { elements: [{ type: "unknown_widget" }] },
    });
    // eslint-disable-next-line no-console
    console.log(
      "unknown",
      JSON.stringify(r2.success ? "ok" : r2.error.issues, null, 2),
    );
  });
  it("log issues — primitive element", () => {
    const r = rootSchema.safeParse({
      version: "1.0",
      page: { elements: [42] },
    });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r.success ? "ok" : r.error.issues, null, 2));
  });
});
