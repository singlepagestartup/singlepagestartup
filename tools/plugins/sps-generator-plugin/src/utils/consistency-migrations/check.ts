import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ConsistencyStore } from "@sps/providers-db";
const store = new ConsistencyStore();
try {
  const manifest = JSON.parse(
    await readFile(
      resolve(
        import.meta.dir,
        "../../../../../../libs/providers/db/src/lib/drizzle/migrations/capture.json",
      ),
      "utf8",
    ),
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
