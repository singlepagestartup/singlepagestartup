/**
 * BDD Suite: client-owned Startup models and relations.
 * Given: the Startup module and its existing Widget model.
 * When: a new model and Widget relation are generated.
 * Then: their standalone generation targets both refresh Consistency Capture.
 */
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { readFileSync } from "node:fs";
import path from "node:path";
import { modelGenerator } from "./generator";
import { relationGenerator } from "../relation/generator";

it("generates Startup model and relation targets with the complete migration contract", async () => {
  const tree = createTreeWithEmptyWorkspace();
  const root = path.resolve(__dirname, "../../../../../..");
  for (const relative of [
    "project.json",
    "backend/app/api/src/lib/apps.ts",
    "frontend/component/src/lib/admin/Component.tsx",
    "frontend/component/src/lib/admin/widget/Component.tsx",
    "models/widget/frontend/component/src/lib/singlepage/admin/form/interface.ts",
    "models/widget/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx",
  ]) {
    const file = `libs/modules/startup/${relative}`;
    tree.write(file, readFileSync(path.join(root, file), "utf8"));
  }
  const previous = process.env.NX_DRY_RUN;
  process.env.NX_DRY_RUN = "true";
  try {
    await modelGenerator(tree, {
      action: "create",
      module: "startup",
      name: "captureprobe",
    });
    await relationGenerator(tree, {
      action: "create",
      module: "startup",
      relation_name: "widgets-to-captureprobes",
      left_module_name: "startup",
      left_model_name: "widget",
      right_module_name: "startup",
      right_model_name: "captureprobe",
    });
  } finally {
    if (previous === undefined) delete process.env.NX_DRY_RUN;
    else process.env.NX_DRY_RUN = previous;
  }
  const project = JSON.parse(
    tree.read("libs/modules/startup/project.json")!.toString(),
  );
  for (const name of [
    "models:captureprobe:repository-generate",
    "relations:widgets-to-captureprobes:repository-generate",
  ]) {
    const target = project.targets[name];
    expect(target.cache).toBe(false);
    expect(target.options.parallel).toBe(false);
    expect(
      target.options.commands.map(
        (command: { command: string }) => command.command,
      ),
    ).toEqual([
      "drizzle-kit up --config=./src/lib/config.ts",
      "drizzle-kit generate --config=./src/lib/config.ts",
      "npx nx run @sps/providers-db:repository-generate",
    ]);
  }
  for (const entity of [
    "models/captureprobe",
    "relations/widgets-to-captureprobes",
  ]) {
    expect(
      tree.exists(
        `libs/modules/startup/${entity}/backend/repository/database/src/lib/schema.ts`,
      ),
    ).toBe(true);
    expect(
      tree.exists(`libs/modules/startup/${entity}/sdk/model/index.ts`),
    ).toBe(true);
  }
});
