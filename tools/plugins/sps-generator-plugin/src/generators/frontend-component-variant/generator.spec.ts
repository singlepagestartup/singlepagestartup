/**
 * BDD Suite: frontend component variant generator.
 *
 * Given: existing model and relation component registries are available in an in-memory Nx tree.
 * When: the frontend component variant generator creates and removes variants.
 * Then: variant files and registry entries are updated for both models and relations.
 */

import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree } from "@nx/devkit";
import { frontendComponentVariantGenerator } from "./generator";

describe("GIVEN: existing frontend component registries", () => {
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
   * BDD Scenario: model variant create and remove.
   *
   * Given: a model component registry has empty singlepage variants.
   * When: a model admin-v2 card variant is created and removed.
   * Then: files and registry references are added and then deleted.
   */
  it("WHEN: creating and removing a model variant THEN: model registry is updated", async () => {
    const tree = createTreeWithEmptyWorkspace();
    seedModelComponent(tree);

    await frontendComponentVariantGenerator(tree, {
      action: "create",
      entity: "category",
      level: "singlepage",
      module: "ecommerce",
      name: "admin-v2-card",
      path: "admin-v2/card",
      template: "admin-v2-card",
      type: "model",
    });

    const componentPath =
      "libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/admin-v2/card/Component.tsx";
    const variantsPath =
      "libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/variants.ts";

    expect(tree.exists(componentPath)).toBe(true);
    expect(readTreeFile(tree, variantsPath)).toContain('"admin-v2-card"');

    await frontendComponentVariantGenerator(tree, {
      action: "remove",
      entity: "category",
      level: "singlepage",
      module: "ecommerce",
      name: "admin-v2-card",
      path: "admin-v2/card",
      template: "admin-v2-card",
      type: "model",
    });

    expect(tree.exists(componentPath)).toBe(false);
    expect(readTreeFile(tree, variantsPath)).not.toContain('"admin-v2-card"');
  });

  /**
   * BDD Scenario: relation variant create and remove.
   *
   * Given: a relation component registry and repository schema imports identify relation models.
   * When: a relation admin-v2 table variant is created and removed.
   * Then: relation files and registry references are added and then deleted.
   */
  it("WHEN: creating and removing a relation variant THEN: relation registry is updated", async () => {
    const tree = createTreeWithEmptyWorkspace();
    seedRelationComponent(tree);

    await frontendComponentVariantGenerator(tree, {
      action: "create",
      entity: "categories-to-products",
      level: "singlepage",
      module: "ecommerce",
      name: "admin-v2-table",
      path: "admin-v2/table",
      template: "admin-v2-table",
      type: "relation",
    });

    const componentPath =
      "libs/modules/ecommerce/relations/categories-to-products/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx";
    const variantsPath =
      "libs/modules/ecommerce/relations/categories-to-products/frontend/component/src/lib/singlepage/variants.ts";

    expect(tree.exists(componentPath)).toBe(true);
    expect(readTreeFile(tree, componentPath)).toContain(
      'name="categories-to-products"',
    );
    expect(readTreeFile(tree, variantsPath)).toContain('"admin-v2-table"');

    await frontendComponentVariantGenerator(tree, {
      action: "remove",
      entity: "categories-to-products",
      level: "singlepage",
      module: "ecommerce",
      name: "admin-v2-table",
      path: "admin-v2/table",
      template: "admin-v2-table",
      type: "relation",
    });

    expect(tree.exists(componentPath)).toBe(false);
    expect(readTreeFile(tree, variantsPath)).not.toContain('"admin-v2-table"');
  });
});

function seedModelComponent(tree: Tree) {
  tree.write(
    "libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/variants.ts",
    "export const variants = {};",
  );
  tree.write(
    "libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/interface.ts",
    "export type IComponentProps = never;",
  );
}

function seedRelationComponent(tree: Tree) {
  tree.write(
    "libs/modules/ecommerce/relations/categories-to-products/backend/repository/database/src/lib/schema.ts",
    'import { Table as Category } from "@sps/ecommerce/models/category/backend/repository/database";\nimport { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";\n',
  );
  tree.write(
    "libs/modules/ecommerce/relations/categories-to-products/frontend/component/src/lib/singlepage/variants.ts",
    "export const variants = {};",
  );
  tree.write(
    "libs/modules/ecommerce/relations/categories-to-products/frontend/component/src/lib/singlepage/interface.ts",
    "export type IComponentProps = never;",
  );
}

function readTreeFile(tree: Tree, path: string) {
  return tree.read(path)?.toString("utf8") ?? "";
}
