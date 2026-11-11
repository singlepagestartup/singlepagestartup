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
  await store.assertCoverage();
  const status = await store.status();
  console.log(
    JSON.stringify({
      resources: manifest.resources.length,
      covered: manifest.resources.length,
      ...status,
    }),
  );
} finally {
  await store.sql.end();
}
