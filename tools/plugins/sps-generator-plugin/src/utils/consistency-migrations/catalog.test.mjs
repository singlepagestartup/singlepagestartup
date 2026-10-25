import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** A child project can keep its deployed Table while inheriting a different capture manifest. */
test("migration catalog follows effective project schemas without rewriting inherited artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "sps-live-catalog-"));
  try {
    await symlink(resolve("node_modules"), join(root, "node_modules"), "dir");
    const entity = join(
      root,
      "libs/modules/social/relations/project-placements",
    );
    await mkdir(join(entity, "backend/repository/database/src/lib"), {
      recursive: true,
    });
    await mkdir(join(entity, "sdk/model"), { recursive: true });
    await writeFile(
      join(entity, "backend/repository/database/src/lib/schema.ts"),
      `import { pgTable, uuid } from "drizzle-orm/pg-core"; export const Table = pgTable("project_calendar", { id: uuid("id"), blogModuleArticleId: uuid("blog_module_article_id") });`,
    );
    await writeFile(
      join(entity, "sdk/model/index.ts"),
      'export const route = "/api/social/project-placements";',
    );
    const directory = join(
      root,
      "libs/providers/db/src/lib/drizzle/migrations",
    );
    await mkdir(directory, { recursive: true });
    const inherited = JSON.stringify({
      fingerprint: "upstream",
      resources: [{ resource: "public.framework_calendar" }],
    });
    const manifest = join(directory, "capture.json");
    await writeFile(manifest, inherited);
    const result = spawnSync(
      "bun",
      [new URL("./generate.ts", import.meta.url).pathname, "--catalog"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const catalog = JSON.parse(result.stdout);
    assert.deepEqual(catalog.resources, [
      {
        resource: "public.project_calendar",
        topic: "social.project-placements",
        columns: { id: "id", blogModuleArticleId: "blog_module_article_id" },
      },
    ]);
    assert.equal(await readFile(manifest, "utf8"), inherited);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
