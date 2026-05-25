import { KnowledgeIndexer } from ".";

function readArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

async function main() {
  const limitArg = readArg("limit");
  const indexer = new KnowledgeIndexer();
  const result = await indexer.index({
    rootPath: readArg("rootPath"),
    limit: limitArg ? Number(limitArg) : undefined,
    dryRun: process.argv.includes("--dry-run"),
    clear: process.argv.includes("--clear"),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
