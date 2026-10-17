import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { checkModuleDependencies } from "./module-dependencies.mjs";

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "sps-module-order-"));
  for (const [path, data] of Object.entries({
    ".agents/contracts/engineering/module-dependencies.md":
      "1. `host`\n2. `knowledge`\n3. `file-storage`\n",
    "tsconfig.base.json": JSON.stringify({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@sps/*": ["libs/modules/*/index.ts"],
          "@shared/*": ["libs/shared/*/index.ts"],
        },
      },
    }),
    "libs/modules/host/index.ts": "export const host = true;",
    "libs/modules/knowledge/index.ts": "export const source = true;",
    "libs/modules/file-storage/index.ts": "export const file = true;",
    ...files,
  })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), data);
  }
  return root;
}

test("allows a higher module to use lower capabilities and its own relative files", () => {
  const root = fixture({
    "libs/modules/host/view.ts":
      "import type { source } from '@sps/knowledge'; export {host} from './index';",
  });
  try {
    assert.equal(checkModuleDependencies(root).violations.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects type-only upward imports and dynamic reexports through neutral barrels", () => {
  const root = fixture({
    "libs/modules/knowledge/view.ts":
      "import type { host } from '@sps/host'; import('@shared/cache');",
    "libs/shared/cache/index.ts": "export * from './nested';",
    "libs/shared/cache/nested.ts": "export { host } from '@sps/host';",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 2);
    assert.equal(result.violations[1].trace.length, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checks tests and import types without treating quoted example strings as imports", () => {
  const root = fixture({
    "libs/modules/file-storage/example.spec.ts":
      "type Forbidden=import('@sps/knowledge').source; const note=\"import('@sps/host')\";",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0].target, "knowledge");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects upward import-equals and literal require calls", () => {
  const root = fixture({
    "libs/modules/file-storage/legacy.ts":
      "import Knowledge = require('@sps/knowledge'); const Host = require('@sps/host');",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 2);
    assert.deepEqual(
      result.violations.map((violation) => violation.target).sort(),
      ["host", "knowledge"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
