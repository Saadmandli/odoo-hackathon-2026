import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const m = envText.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
if (!m) { console.error("DATABASE_URL not found in .env"); process.exit(1); }
const url = m[1].trim().replace(/^["']|["']$/g, "");
const host = (url.split("@")[1] || "").split("/")[0];
console.log("Seeding database at:", host || url);
execSync("npx tsx prisma/seed.ts", { cwd: root, env: { ...process.env, DATABASE_URL: url }, stdio: "inherit", shell: true });
console.log("\n✓ Done.");
