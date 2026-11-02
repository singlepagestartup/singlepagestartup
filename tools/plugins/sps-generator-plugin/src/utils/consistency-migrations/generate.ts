import { getTableConfig } from "drizzle-orm/pg-core";
import { getTableColumns } from "drizzle-orm";
import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { captureFunctionsSQL, installCaptureSQL } from "./index";

const root = process.cwd();
const out = resolve(root, "libs/providers/db/src/lib/drizzle/migrations");
const catalog = [];
for await (const file of new Bun.Glob(
  "libs/modules/*/{models,relations}/*/backend/repository/database/src/lib/schema.ts",
).scan({ cwd: root })) {
  const module = await import(resolve(root, file));
  if (!module.Table) continue;
  const config = getTableConfig(module.Table);
  const entityRoot = file.split("/backend/")[0];
  const sdk = await import(resolve(root, entityRoot, "sdk/model/index.ts"));
  const topic = String(sdk.route)
    .replace(/^\/api\//, "")
    .replaceAll("/", ".");
  if (!sdk.route?.startsWith("/api/"))
    throw new Error(`Missing SDK route: ${entityRoot}`);
  catalog.push({
    resource: `${config.schema || "public"}.${config.name}`,
    topic,
    columns: Object.fromEntries(
      Object.entries(getTableColumns(module.Table)).map(([key, column]) => [
        key,
        column.name,
      ]),
    ),
  });
}
catalog.sort((a, b) => a.resource.localeCompare(b.resource));
if (new Set(catalog.map((v) => v.resource)).size !== catalog.length)
  throw new Error("Duplicate physical resource");
const generated =
  captureFunctionsSQL() +
  "\n" +
  catalog.map(installCaptureSQL).join("\n") +
  `
-- A changed capture contract invalidates older dependency vectors atomically.
SELECT sps_consistency.bump(ARRAY(SELECT resource||'|reset' FROM sps_consistency.resource ORDER BY resource));
UPDATE sps_consistency.state SET value=gen_random_uuid()::text WHERE id='epoch';
`;
const fingerprint = createHash("sha256").update(generated).digest("hex");
const manifest = resolve(out, "capture.json");
let previous = "";
try {
  previous = JSON.parse(await readFile(manifest, "utf8")).fingerprint;
} catch {}
if (process.argv.includes("--check") && previous !== fingerprint)
  throw new Error(
    "Capture catalog is stale. Run @sps/providers-db:repository-generate",
  );
if (previous === fingerprint) {
  console.log(`Capture unchanged: ${catalog.length} resources`);
  process.exit(0);
}
const before = JSON.parse(
  await readFile(resolve(out, "meta/_journal.json"), "utf8"),
).entries.length;
const run = Bun.spawnSync(
  [
    "bun",
    resolve(root, "node_modules/drizzle-kit/bin.cjs"),
    "generate",
    "--custom",
    "--name=consistency-capture",
    "--config=libs/providers/db/src/lib/drizzle/config.ts",
  ],
  { cwd: root, stdout: "inherit", stderr: "inherit" },
);
if (run.exitCode) process.exit(run.exitCode);
const journal = JSON.parse(
  await readFile(resolve(out, "meta/_journal.json"), "utf8"),
);
if (journal.entries.length !== before + 1)
  throw new Error(
    "Drizzle did not create a custom migration; existing migrations were not modified",
  );
await writeFile(resolve(out, journal.entries.at(-1).tag + ".sql"), generated);
await writeFile(
  manifest,
  JSON.stringify({ fingerprint, resources: catalog }, null, 2) + "\n",
);
console.log(`Generated capture: ${catalog.length} resources`);
