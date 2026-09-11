import { readFile } from "node:fs/promises";
import path from "node:path";
import { documentConfirmation, documentFingerprint } from "./document";
import { loadWorkspace } from "./loader";
import { loadDocumentReviews } from "./review-loader";
import { reviewId } from "./review";

// Read-only: this resolves the fingerprint; it never records user consent.
export async function reviewDocument(
  argument: string,
  repositoryRoot = process.cwd(),
) {
  const workspaceRoot = path.join(repositoryRoot, "apps/studio/workspace");
  const absolutePath = path.resolve(repositoryRoot, argument);
  const relative = path.relative(workspaceRoot, absolutePath);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !/\.(md|yaml)$/.test(relative)
  ) {
    throw new Error(
      "The file must be a Markdown or YAML document inside apps/studio/workspace",
    );
  }
  const layer = /(?:^|\/)startup(?:\/|\.)/.test(relative)
    ? "startup"
    : "singlepage";
  const graph = await loadWorkspace({ activeLayer: layer, repositoryRoot });
  const entry = graph.loadedEntries.find((entry) =>
    entry.sourcePaths.includes(absolutePath),
  );
  const source = entry?.content ?? (await readFile(absolutePath, "utf8"));
  const format = relative.endsWith(".yaml") ? "yaml" : "markdown";
  const reviews = await loadDocumentReviews(workspaceRoot, layer);
  const review = entry
    ? reviews.get(reviewId(entry.extends ?? entry.id))
    : [...reviews.values()].find(({ document }) => document.path === relative);
  const affected = new Set(review ? [review.document.id] : []);
  const dependents: Array<{ id: string; path: string; state: string }> = [];
  let pending = true;
  while (pending) {
    pending = false;
    for (const [id, candidate] of reviews) {
      if (
        affected.has(id) ||
        !candidate.document.uses.some((input) => affected.has(input))
      )
        continue;
      affected.add(id);
      dependents.push({
        id,
        path: candidate.document.path,
        state: candidate.confirmation.state,
      });
      pending = true;
    }
  }
  return {
    file: argument,
    layer,
    confirmation:
      entry?.confirmation ??
      review?.confirmation ??
      documentConfirmation(source, layer, format),
    review: {
      dependencies: entry?.reviewDependencies ?? review?.dependencies ?? {},
    },
    content_sha256: documentFingerprint(source, format),
    source_paths: entry?.sourcePaths ?? [absolutePath],
    dependents,
  };
}

if (import.meta.main) {
  const flag = process.argv.indexOf("--file");
  const argument = flag < 0 ? undefined : process.argv[flag + 1];
  if (!argument) throw new Error("Provide --file <workspace document>");
  process.stdout.write(
    `${JSON.stringify(await reviewDocument(argument), null, 2)}\n`,
  );
}
