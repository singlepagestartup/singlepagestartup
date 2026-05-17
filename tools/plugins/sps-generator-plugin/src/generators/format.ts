import { formatFiles, Tree } from "@nx/devkit";

export async function formatGeneratorFiles(tree: Tree) {
  const isDryRun =
    process.argv.includes("--dry-run") ||
    process.argv.includes("--dryRun") ||
    process.env.NX_DRY_RUN === "true";

  if (isDryRun) {
    return;
  }

  await formatFiles(tree);
}
