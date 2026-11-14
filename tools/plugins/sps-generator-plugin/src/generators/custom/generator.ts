import type { Tree } from "@nx/devkit";
import { frontendComponentVariantGenerator } from "../frontend-component-variant/generator";

export async function customGenerator(tree: Tree) {
  const variants = [
    "admin-form",
    "admin-select-input",
    "admin-table",
    "admin-table-row",
  ];
  for (const name of variants) {
    await frontendComponentVariantGenerator(tree, {
      module: "broadcast",
      type: "model",
      entity: "message",
      name,
      action: "create",
      level: "singlepage",
      template: name,
      path: name,
    });
  }
}

export default customGenerator;
