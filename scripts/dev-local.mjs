/**
 * Zero-setup local launcher.
 * Boots an embedded PostgreSQL (no Docker / no install needed), applies the
 * schema, seeds demo data on first run, then starts the Next.js dev server.
 * Just `npm run dev:local` and open http://localhost:3000.
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, ".localdb");
const PG_PORT = 5433;
const DB_URL = `postgresql://vendorbridge:vendorbridge@localhost:${PG_PORT}/vendorbridge?schema=public`;

const env = { ...process.env, DATABASE_URL: DB_URL, JWT_SECRET: process.env.JWT_SECRET || "local-dev-secret-local-dev-secret-1234567890" };

const pg = new EmbeddedPostgres({
  databaseDir: dataDir, user: "vendorbridge", password: "vendorbridge", port: PG_PORT, persistent: true,
});

let server;
async function shutdown() {
  console.log("\nShutting down…");
  try { server?.kill(); } catch {}
  try { await pg.stop(); } catch {}
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
  const firstRun = !fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (firstRun) {
    console.log("• First run: initializing local database (one-time)…");
    await pg.initialise();
  }
  console.log("• Starting local PostgreSQL…");
  await pg.start();
  try { await pg.createDatabase("vendorbridge"); } catch {}

  console.log("• Applying database schema…");
  execSync("npx prisma db push --skip-generate --accept-data-loss", { cwd: root, env, stdio: "inherit", shell: true });

  // Seed only if empty
  const { PrismaClient } = await import("@prisma/client");
  process.env.DATABASE_URL = DB_URL;
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count().catch(() => 0);
  await prisma.$disconnect();
  if (userCount === 0) {
    console.log("• Seeding demo data…");
    execSync("npx tsx prisma/seed.ts", { cwd: root, env, stdio: "inherit", shell: true });
  } else {
    console.log(`• Database already has ${userCount} users — skipping seed.`);
  }

  console.log("\n✓ Database ready. Starting the app on http://localhost:3000 …\n");
  // shell:true is required so this also works on Windows — spawning npm without
  // a shell throws "spawn EINVAL" on recent Node versions.
  server = spawn("npm run dev", { cwd: root, env, stdio: "inherit", shell: true });
  server.on("exit", (code) => { pg.stop().finally(() => process.exit(code ?? 0)); });
})().catch(async (e) => {
  console.error("Failed to start:", e.message || e);
  try { await pg.stop(); } catch {}
  process.exit(1);
});
