/**
 * Reloads the full demo dataset into the running local database.
 * Use while `npm run dev:local` is running (in a second terminal):
 *     npm run db:reseed
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://vendorbridge:vendorbridge@localhost:5433/vendorbridge?schema=public",
};
console.log("Reloading demo data into the local database…");
execSync("npx tsx prisma/seed.ts", { cwd: root, env, stdio: "inherit", shell: true });
console.log("\n✓ Done. Refresh your browser to see the new data.");
