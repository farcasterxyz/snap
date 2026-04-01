import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const skillPath = join(process.cwd(), "..", "..", "agent-skills", "create-farcaster-snap", "SKILL.md");
  try {
    const content = readFileSync(skillPath, "utf-8");
    return new Response(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="create-farcaster-snap.md"',
      },
    });
  } catch {
    return new Response("Skill file not found", { status: 404 });
  }
}
