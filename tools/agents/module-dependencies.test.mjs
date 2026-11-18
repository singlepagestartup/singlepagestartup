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

test("rejects incoming relation imports in a lower model, including through a neutral barrel", () => {
  const root = fixture({
    "libs/modules/knowledge/models/source/backend/app/index.ts":
      "import type { link } from '@shared/link';",
    "libs/shared/link/index.ts":
      "export { link } from '@sps/knowledge/relations/topics-to-sources';",
    "libs/modules/knowledge/relations/topics-to-sources/index.ts":
      "export const link = true;",
    "libs/modules/knowledge/models/topic/backend/app/index.ts":
      "import { link } from '@sps/knowledge/relations/topics-to-sources';",
    "libs/modules/knowledge/relations/topics-to-sources/schema.ts":
      "import { source } from '@sps/knowledge';",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0].source, "knowledge.source");
    assert.equal(result.violations[0].trace.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolves type-only aliases through the owning module's re-exports", () => {
  const root = fixture({
    "libs/modules/knowledge/index.ts":
      "export * from './relations'; export const safe = true;",
    "libs/modules/knowledge/relations.ts":
      "import type { Link } from './relations/topics-to-sources'; export type { Link as TopicLink };",
    "libs/modules/knowledge/relations/topics-to-sources/index.ts":
      "export interface Link { source: string }",
    "libs/modules/knowledge/models/source/backend/app/invalid.ts":
      "type Forbidden = import('@sps/knowledge').TopicLink;",
    "libs/modules/knowledge/models/source/backend/app/valid.ts":
      "import type { safe } from '@sps/knowledge';",
    "libs/modules/knowledge/models/topic/backend/app/valid.ts":
      "import type { TopicLink } from '@sps/knowledge';",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 1);
    assert.match(
      result.violations[0].file,
      /source\/backend\/app\/invalid\.ts$/,
    );
    assert.equal(result.violations[0].target, "knowledge.topics-to-sources");
    assert.deepEqual(
      result.violations[0].trace.map((step) => step.specifier),
      ["@sps/knowledge", "./relations", "./relations/topics-to-sources"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a lower model reaching an incoming relation through a shared wrapper", () => {
  const root = fixture({
    "libs/modules/knowledge/models/source/backend/app/index.ts":
      "import { wrap } from '@shared/link'; export const source = () => wrap();",
    "libs/shared/link/index.ts":
      "import { link } from '@sps/knowledge/relations/topics-to-sources'; export const wrap = () => link();",
    "libs/modules/knowledge/relations/topics-to-sources/index.ts":
      "export const link = () => true;",
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0].source, "knowledge.source");
    assert.equal(result.violations[0].target, "knowledge.topics-to-sources");
    assert.equal(result.violations[0].trace.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reports a cycle through service factories and ignores schema or type-only references", () => {
  const topic = "libs/modules/knowledge/models/topic/backend/app/api/src/lib";
  const source = "libs/modules/knowledge/models/source/backend/app/api/src/lib";
  const relation =
    "libs/modules/knowledge/relations/topics-to-sources/backend/app/api/src/lib";
  const root = fixture({
    [`${topic}/bootstrap.ts`]: `
      import { createService as createRelation } from '../../../../../../../relations/topics-to-sources/backend/app/api/src/lib/bootstrap';
      export const createService = () => createRelation();
    `,
    [`${relation}/bootstrap.ts`]: `
      export const createService = () => {
        const owner: typeof import('../../../../../../../models/source/backend/app/api/src/lib/bootstrap') =
          require('../../../../../../../models/source/backend/app/api/src/lib/bootstrap');
        return owner.createService();
      };
    `,
    [`${source}/bootstrap.ts`]: `
      import { createTopic } from '@sps/knowledge';
      export type Lookup = typeof createTopic;
      export const createService = () => {
        const owner: typeof import('@sps/knowledge') = require('@sps/knowledge');
        type Factory = typeof owner.createService;
        return owner.readPolicy();
      };
      export const receipt = () => {
        const owner: typeof import('@shared/receipt') = require('@shared/receipt');
        return owner.createService();
      };
      export const apply = async () => {
        const { createService: createParent } = await import('@sps/knowledge');
        return createParent();
      };
    `,
    [`${source}/service/modules.ts`]:
      "import * as services from '@sps/knowledge'; export const createServices = () => services.createTopic();",
    "libs/modules/knowledge/index.ts": `
      export { createService, createService as createTopic } from './models/topic/backend/app/api/src/lib/bootstrap';
      export const readPolicy = () => ({});
    `,
    "libs/shared/receipt/index.ts": "export const createService = () => ({});",
    "libs/modules/knowledge/models/topic/backend/repository/database/schema.ts":
      "export const topic = { id: 'topic' };",
    "libs/modules/knowledge/models/source/backend/repository/database/schema.ts":
      "export const source = { id: 'source' };",
    "libs/modules/knowledge/relations/topics-to-sources/backend/repository/database/schema.ts": `
      import { topic } from '../../../../../models/topic/backend/repository/database/schema';
      import { source } from '../../../../../models/source/backend/repository/database/schema';
      export const foreignKeys = [topic.id, source.id];
    `,
  });
  try {
    const result = checkModuleDependencies(root);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0].reason, "Circular service composition");
    assert.equal(new Set(result.violations[0].cycle).size, 3);
    assert.equal(result.violations[0].trace.length, 4);
    assert.equal(
      result.violations[0].cycle[0],
      result.violations[0].cycle.at(-1),
    );

    rmSync(join(root, source, "service", "modules.ts"));
    assert.deepEqual(checkModuleDependencies(root).violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
