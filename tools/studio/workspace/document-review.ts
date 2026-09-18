import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument as parseYamlDocument, stringify } from "yaml";
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
        ![
          ...candidate.document.uses,
          ...(candidate.document.observes ?? []),
        ].some((input) => affected.has(input))
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

const FRONTMATTER = /^(﻿?---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/;

/**
 * Replace the recorded fingerprints in place.
 *
 * Re-rendering the whole metadata would rewrap long scalars and expand flow
 * sequences elsewhere in the file, so the new block is spliced over the exact
 * source range of the old one. Returns null when there is no block to replace.
 */
function spliceDependencies(
  metadata: string,
  dependencies: Record<string, string>,
): { text: string; recorded: unknown } | null {
  const parsed = parseYamlDocument(metadata);
  const node = parsed.getIn(["review", "dependencies"], true) as
    | { range?: [number, number, number] }
    | undefined;
  if (!node?.range) return null;
  const [start, valueEnd] = node.range;
  const lineStart = metadata.lastIndexOf("\n", start - 1) + 1;
  const lineIndent = metadata.slice(lineStart).match(/^[ \t]*/)![0];
  // `dependencies: {}` keeps the value on the key's line; a block map does not.
  const inline = start > lineStart + lineIndent.length;
  const indent = inline ? `${lineIndent}  ` : lineIndent;
  const entries = Object.keys(dependencies).length
    ? stringify(dependencies, { lineWidth: 0 })
        .trimEnd()
        .split("\n")
        .join(`\n${indent}`)
    : "{}";
  const rendered =
    inline && entries !== "{}" ? `\n${indent}${entries}` : entries;
  // The range may end past the block's last line; keep whatever followed it.
  const replaced = metadata.slice(start, valueEnd);
  const trailing = replaced.slice(replaced.trimEnd().length);
  return {
    text:
      metadata.slice(0, start) + rendered + trailing + metadata.slice(valueEnd),
    recorded: parsed.getIn(["review", "dependencies"]) ?? null,
  };
}

/**
 * Write the inspected input fingerprints into the document's own metadata.
 *
 * This records that the inputs were examined and had no material effect. It
 * never touches `confirmation` and never clears `review.stale`: an approval
 * follows from the user, and an unresolved material impact follows from the
 * correction, not from a refreshed hash.
 */
export async function refreshDocumentDependencies(
  argument: string,
  repositoryRoot = process.cwd(),
) {
  const inspected = await reviewDocument(argument, repositoryRoot);
  const dependencies = inspected.review.dependencies;
  const file = path.resolve(repositoryRoot, argument);
  const before = await readFile(file, "utf8");
  const match = argument.endsWith(".yaml") ? null : before.match(FRONTMATTER);
  if (!argument.endsWith(".yaml") && !match)
    throw new Error(`${argument} has no frontmatter to refresh`);
  const metadata = match ? match[2] : before;
  const spliced = spliceDependencies(metadata, dependencies);
  if (!spliced)
    throw new Error(
      `${argument} records no review.dependencies block; add one with the inputs this document was written against, then refresh it`,
    );
  const after = match
    ? match[1] + spliced.text + match[3] + before.slice(match[0].length)
    : spliced.text;
  const changed = after !== before;
  if (changed) await writeFile(file, after);
  return {
    file: argument,
    changed,
    recorded_before: spliced.recorded,
    dependencies,
    confirmation: inspected.confirmation,
  };
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (import.meta.main) {
  const argument = option("--file");
  if (!argument) throw new Error("Provide --file <workspace document>");
  const repositoryRoot = path.resolve(option("--repository-root") ?? ".");
  const result = process.argv.includes("--refresh")
    ? await refreshDocumentDependencies(argument, repositoryRoot)
    : await reviewDocument(argument, repositoryRoot);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
