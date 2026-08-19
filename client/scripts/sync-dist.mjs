import { rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
);
const serverDist = path.resolve(clientDist, "..", "..", "server", "dist");

if (!existsSync(clientDist)) {
  console.error("[sync-dist] client/dist does not exist. Run `vite build` first.");
  process.exit(1);
}

rmSync(serverDist, { recursive: true, force: true });
mkdirSync(serverDist, { recursive: true });
cpSync(clientDist, serverDist, { recursive: true });
console.log(`[sync-dist] copied ${clientDist} -> ${serverDist}`);
