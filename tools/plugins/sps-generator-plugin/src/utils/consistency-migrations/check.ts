import { resolve } from "node:path";
import { ConsistencyStore } from "@sps/providers-db";
const store = new ConsistencyStore();
try {
  const discovery = Bun.spawnSync(
    [process.execPath, resolve(import.meta.dir, "generate.ts"), "--catalog"],
    { cwd: process.cwd(), stdout: "pipe", stderr: "inherit" },
  );
  if (discovery.exitCode !== 0)
    throw new Error("Could not discover the effective consistency catalog");
  const manifest = JSON.parse(new TextDecoder().decode(discovery.stdout));
  if (!Array.isArray(manifest.resources) || !manifest.resources.length)
    throw new Error(
      "No effective consistency schemas found; run checks from the repository root",
    );
  const uncovered: string[] = [];
  for (const { resource } of manifest.resources)
    if (!(await store.covered(resource))) uncovered.push(resource);
  if (uncovered.length)
    throw new Error(
      `Consistency capture missing on ${uncovered.length} resources: ${uncovered.join(", ")}`,
    );
  console.log(
    JSON.stringify({
      resources: manifest.resources.length,
      covered: manifest.resources.length,
      ...(await store.status()),
    }),
  );
} finally {
  await store.sql.end();
}
