import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { captureFunctionsSQL } from "./index";

const root = process.cwd();
const out = resolve(root, "libs/providers/db/src/lib/drizzle/migrations");
const journalPath = resolve(out, "meta/_journal.json");
interface IEntry {
  tag: string;
}
async function readEntries(): Promise<IEntry[]> {
  const journal = JSON.parse(await readFile(journalPath, "utf8"));
  return journal.entries;
}

const functions = captureFunctionsSQL();
const reset = `
-- A changed capture contract invalidates older dependency vectors atomically.
SELECT sps_consistency.bump(ARRAY(SELECT resource||'|reset' FROM sps_consistency.resource ORDER BY resource));
UPDATE sps_consistency.state SET value=gen_random_uuid()::text WHERE id='epoch';
`;
const reinstall = `
SELECT sps_consistency.install_capture(resource, topic, columns)
FROM sps_consistency.resource WHERE to_regclass(resource) IS NOT NULL ORDER BY resource;
`;
const generated = functions + reinstall + reset;
const entries = await readEntries();
const last = entries
  .slice()
  .reverse()
  .find(({ tag }) => tag.endsWith("_consistency-capture"));
if (last) {
  const previous = await readFile(resolve(out, last.tag + ".sql"), "utf8");
  // Historical snapshots stored one install_capture('table', ...) per entity.
  const installs = previous.indexOf(
    "\nSELECT sps_consistency.install_capture('",
  );
  const sameHistoricalEngine =
    installs >= 0 &&
    previous.slice(0, installs).trimEnd() === functions.trimEnd() &&
    previous.endsWith(reset);
  if (previous === generated || sameHistoricalEngine) {
    console.log("Consistency capture functions unchanged");
    process.exit(0);
  }
}
if (process.argv.includes("--check")) {
  throw new Error(
    "Capture functions changed. Run @sps/providers-db:repository-generate",
  );
}
const result = Bun.spawnSync(
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
if (result.exitCode !== 0) {
  process.exit(result.exitCode);
}
const updated = await readEntries();
if (updated.length !== entries.length + 1) {
  throw new Error("Drizzle did not create one capture migration");
}
await writeFile(
  resolve(out, updated[updated.length - 1].tag + ".sql"),
  generated,
);
