#!/usr/bin/env node
/**
 * Checks the placement rules in
 * `.agents/contracts/engineering/code-placement.md` that can be decided by
 * looking at the tree.
 *
 * Today that is one rule: a source file must not sit beside a folder of the
 * same name. An import of `./thing` resolves to either, so the thing ends up
 * living in two places under one name and a reader finds half of it. The fix is
 * to move the file into the folder as its `index.ts`.
 *
 * Usage: node tools/agents/code-placement.mjs [root...]
 * Exits non-zero when a violation is found, so it can gate a change.
 */

import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

export function findSameNameCollisions(root) {
  const collisions = [];

  const walk = (directory) => {
    let entries;

    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    const directoryNames = new Set(
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    );

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          walk(join(directory, entry.name));
        }
        continue;
      }

      const extension = SOURCE_EXTENSIONS.find((candidate) =>
        entry.name.endsWith(candidate),
      );

      if (!extension || entry.name.endsWith(".d.ts")) {
        continue;
      }

      const base = entry.name.slice(0, -extension.length);

      if (directoryNames.has(base)) {
        collisions.push({
          file: join(directory, entry.name),
          directory: join(directory, base),
        });
      }
    }
  };

  walk(root);

  return collisions;
}

const isEntryPoint =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());

if (isEntryPoint) {
  const roots = process.argv.slice(2);
  const targets = roots.length ? roots : ["libs", "apps", "tools"];
  const found = targets.flatMap((target) =>
    findSameNameCollisions(resolve(target)),
  );

  if (!found.length) {
    console.log("Code placement: no same-name file and folder pairs found.");
    process.exit(0);
  }

  console.error(
    `Code placement: ${found.length} file(s) sit beside a folder of the same name.`,
  );
  console.error(
    "Move each file into its folder as index.ts; importers of the path do not change.\n",
  );

  for (const collision of found) {
    console.error(`  ${collision.file}`);
    console.error(`  → ${collision.directory}/index.ts\n`);
  }

  process.exit(1);
}
