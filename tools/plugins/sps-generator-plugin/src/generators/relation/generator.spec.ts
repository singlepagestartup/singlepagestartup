import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { readFileSync } from "node:fs";
import path from "node:path";
import { relationGenerator } from "./generator";

it("generates distinct cross-module Widget fields without changing the lower owner's admin", async () => {
  const tree = createTreeWithEmptyWorkspace();
  const root = path.resolve(__dirname, "../../../../../..");
  for (const module of ["rbac", "website-builder"]) {
    for (const relative of [
      "project.json",
      "backend/app/api/src/lib/apps.ts",
      "frontend/component/src/lib/admin/widget/Component.tsx",
      "models/widget/frontend/component/src/lib/singlepage/admin/form/interface.ts",
      "models/widget/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx",
    ]) {
      const file = `libs/modules/${module}/${relative}`;
      tree.write(file, readFileSync(path.join(root, file), "utf8"));
    }
  }
  const lowerBefore = tree
    .read(
      "libs/modules/website-builder/frontend/component/src/lib/admin/widget/Component.tsx",
    )
    ?.toString();
  const previous = process.env.NX_DRY_RUN;
  process.env.NX_DRY_RUN = "true";
  try {
    await relationGenerator(tree, {
      action: "create",
      module: "rbac",
      relation_name: "probe-widgets-to-widgets",
      left_model_name: "widget",
      left_module_name: "rbac",
      right_model_name: "widget",
      right_module_name: "website-builder",
    });
  } finally {
    if (previous === undefined) delete process.env.NX_DRY_RUN;
    else process.env.NX_DRY_RUN = previous;
  }
  const base = "libs/modules/rbac/relations/probe-widgets-to-widgets";
  const schema = tree
    .read(`${base}/backend/repository/database/src/lib/schema.ts`)!
    .toString();
  expect(schema).toContain("Table as WebsiteBuilderModuleWidget");
  expect(schema).toContain("websiteBuilderModuleWidgetId:");
  expect(schema.match(/widgetId:/g)).toHaveLength(1);
  const form = tree
    .read(
      `${base}/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`,
    )!
    .toString();
  expect(form).toContain('formFieldName="websiteBuilderModuleWidgetId"');
  expect(
    tree
      .read(
        "libs/modules/website-builder/frontend/component/src/lib/admin/widget/Component.tsx",
      )
      ?.toString(),
  ).toBe(lowerBefore);
});
