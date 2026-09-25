/**
 * BDD Suite: the code placement check.
 * Given a tree where a source file may sit beside a folder of the same name
 * When the tree is scanned
 * Then only that pairing is reported, and a folder holding its own index.ts is not.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findSameNameCollisions } from "./code-placement.mjs";

function makeTree(files) {
  const root = mkdtempSync(join(tmpdir(), "code-placement-"));

  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, contents);
  }

  return root;
}

/**
 * BDD Scenario
 * Given a file and a folder that share a name.
 * When the tree is scanned.
 * Then the pair is reported with the index.ts it should become.
 */
test("reports a file sitting beside a folder of the same name", () => {
  const root = makeTree({
    "src/thing.ts": "export const a = 1;",
    "src/thing/other.ts": "export const b = 2;",
  });

  try {
    const found = findSameNameCollisions(root);
    assert.equal(found.length, 1);
    assert.ok(found[0].file.endsWith("src/thing.ts"));
    assert.ok(found[0].directory.endsWith("src/thing"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * BDD Scenario
 * Given a thing that already lives in a folder with its own index.
 * When the tree is scanned.
 * Then nothing is reported, because that is the shape the rule asks for.
 */
test("accepts a folder holding its own index", () => {
  const root = makeTree({
    "src/thing/index.ts": "export const a = 1;",
    "src/thing/other.ts": "export const b = 2;",
  });

  try {
    assert.deepEqual(findSameNameCollisions(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * BDD Scenario
 * Given a declaration file named after a folder, and a dependency directory.
 * When the tree is scanned.
 * Then neither is reported: a .d.ts declares types and node_modules is not ours.
 */
test("ignores declaration files and dependency directories", () => {
  const root = makeTree({
    "src/thing.d.ts": "export declare const a: number;",
    "src/thing/index.ts": "export const a = 1;",
    "node_modules/pkg/thing.ts": "export const c = 3;",
    "node_modules/pkg/thing/index.ts": "export const d = 4;",
  });

  try {
    assert.deepEqual(findSameNameCollisions(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * BDD Scenario
 * Given a .tsx component beside a folder of the same name.
 * When the tree is scanned.
 * Then it is reported too, because the rule is about the name, not the extension.
 */
test("reports a tsx file beside its folder", () => {
  const root = makeTree({
    "src/Card.tsx": "export const Card = () => null;",
    "src/Card/parts.tsx": "export const Part = () => null;",
  });

  try {
    const found = findSameNameCollisions(root);
    assert.equal(found.length, 1);
    assert.ok(found[0].file.endsWith("src/Card.tsx"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
