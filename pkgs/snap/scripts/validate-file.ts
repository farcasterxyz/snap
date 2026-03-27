// Usage: pnpm exec tsx validate-file.ts <path-to-json>
import { validatePage, validateFirstPage } from "../src/index";
import fs from "fs";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: pnpm exec tsx validate-file.ts <path-to-json>");
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
const result = validatePage(json);
const firstPageResult = validateFirstPage(json);

console.log("=== Page Validation ===");
console.log(JSON.stringify(result, null, 2));

if (firstPageResult.issues.length > result.issues.length) {
  console.log("\n=== First Page Validation ===");
  console.log(JSON.stringify(firstPageResult, null, 2));
}

process.exit(result.valid ? 0 : 1);
