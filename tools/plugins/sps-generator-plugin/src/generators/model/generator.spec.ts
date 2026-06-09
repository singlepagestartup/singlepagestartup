/**
 * BDD Suite: model generator output.
 *
 * Given: an existing ecommerce module shell is available in an in-memory Nx tree.
 * When: the model generator creates a default model.
 * Then: generated files match current SPS backend layering and frontend variants.
 */

import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree } from "@nx/devkit";
import { modelGenerator } from "./generator";

describe("GIVEN: an SPS module tree exists", () => {
  const previousNxDryRun = process.env.NX_DRY_RUN;

  beforeEach(() => {
    process.env.NX_DRY_RUN = "true";
  });

  afterEach(() => {
    if (previousNxDryRun === undefined) {
      delete process.env.NX_DRY_RUN;
      return;
    }

    process.env.NX_DRY_RUN = previousNxDryRun;
  });

  /**
   * BDD Scenario: default model output follows current SPS conventions.
   *
   * Given: module backend/frontend attachment files and repository targets exist.
   * When: the model generator creates a new model.
   * Then: backend API files use startup/singlepage layering and admin-v2 variants are registered.
   */
  it("WHEN: generating a default model THEN: output matches current model conventions", async () => {
    const tree = createSpsModuleTree();

    await modelGenerator(tree, {
      action: "create",
      module: "ecommerce",
      name: "codex-probe",
    });

    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/controller/index.ts",
      ),
    ).toContain('export { Controller } from "./startup";');
    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/controller/startup/index.ts",
      ),
    ).toContain("extends ParentController");
    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/controller/singlepage/index.ts",
      ),
    ).toContain("extends RESTController");
    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/service/index.ts",
      ),
    ).toContain('export { Service } from "./startup";');
    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/service/startup/index.ts",
      ),
    ).toContain("extends ParentService");
    expect(
      readTreeFile(
        tree,
        "libs/modules/ecommerce/models/codex-probe/backend/app/api/src/lib/service/singlepage/index.ts",
      ),
    ).toContain("extends CRUDService");

    const variants = readTreeFile(
      tree,
      "libs/modules/ecommerce/models/codex-probe/frontend/component/src/lib/singlepage/variants.ts",
    );
    const componentInterface = readTreeFile(
      tree,
      "libs/modules/ecommerce/models/codex-probe/frontend/component/src/lib/singlepage/interface.ts",
    );

    expect(variants).toContain('"admin-v2-table-row"');
    expect(variants).toContain('"admin-v2-table"');
    expect(variants).toContain('"admin-v2-select-input"');
    expect(variants).toContain('"admin-v2-form"');
    expect(variants).toContain('"admin-v2-card"');
    expect(variants).toContain('"admin-v2-sidebar-item"');
    expect(componentInterface).toContain("IAdminV2TableRowComponentProps");
    expect(componentInterface).toContain("IAdminV2SidebarItemComponentProps");
  });
});

function createSpsModuleTree() {
  const tree = createTreeWithEmptyWorkspace();

  tree.write(
    "libs/modules/ecommerce/project.json",
    JSON.stringify({
      name: "@sps/ecommerce",
      targets: {
        "models:repository-generate": {
          options: {
            commands: [],
          },
        },
        "models:repository-migrate": {
          options: {
            commands: [],
          },
        },
      },
    }),
  );
  tree.write(
    "libs/modules/ecommerce/backend/app/api/src/lib/apps.ts",
    'import { DefaultApp } from "@sps/shared-backend-api";\n\nexport class Apps {\n  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = [];\n\n  bindApps() {}\n}\n',
  );
  tree.write(
    "libs/modules/ecommerce/frontend/component/src/lib/admin/Component.tsx",
    'import { IComponentProps } from "./interface";\n\nexport function Component(props: IComponentProps) {\n  const models = [];\n  return null;\n}\n',
  );

  return tree;
}

function readTreeFile(tree: Tree, path: string) {
  return tree.read(path)?.toString("utf8") ?? "";
}
