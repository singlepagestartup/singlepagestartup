import { Tree } from "@nx/devkit";
import { ModelGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { formatGeneratorFiles } from "../format";

// npx nx generate @sps/sps-generator-plugin:model test-model --action=create --module=startup --no-interactive --dry-run
export async function modelGenerator(
  tree: Tree,
  options: ModelGeneratorSchema,
) {
  const modelName = options.name;
  const moduleName = options.module;

  const coder = new Coder({
    tree,
    root: {
      libs: {
        modules: [
          {
            module: {
              name: moduleName,
              models: [
                {
                  model: {
                    name: modelName,
                    frontend: {
                      component: {
                        variants: [
                          {
                            name: "find",
                            level: "singlepage",
                            template: "find",
                            path: "find",
                          },
                          {
                            name: "default",
                            level: "singlepage",
                            template: "default",
                            path: "default",
                          },
                          {
                            name: "admin-table-row",
                            level: "singlepage",
                            template: "admin-table-row",
                            path: "admin/table-row",
                          },
                          {
                            name: "admin-form",
                            level: "singlepage",
                            template: "admin-form",
                            path: "admin/form",
                          },
                          {
                            name: "admin-table",
                            level: "singlepage",
                            template: "admin-table",
                            path: "admin/table",
                          },
                          {
                            name: "admin-select-input",
                            level: "singlepage",
                            template: "admin-select-input",
                            path: "admin/select-input",
                          },
                          {
                            name: "admin-v2-table-row",
                            level: "singlepage",
                            template: "admin-v2-table-row",
                            path: "admin-v2/table-row",
                          },
                          {
                            name: "admin-v2-table",
                            level: "singlepage",
                            template: "admin-v2-table",
                            path: "admin-v2/table",
                          },
                          {
                            name: "admin-v2-select-input",
                            level: "singlepage",
                            template: "admin-v2-select-input",
                            path: "admin-v2/select-input",
                          },
                          {
                            name: "admin-v2-form",
                            level: "singlepage",
                            template: "admin-v2-form",
                            path: "admin-v2/form",
                          },
                          {
                            name: "admin-v2-card",
                            level: "singlepage",
                            template: "admin-v2-card",
                            path: "admin-v2/card",
                          },
                          {
                            name: "admin-v2-sidebar-item",
                            level: "singlepage",
                            template: "admin-v2-sidebar-item",
                            path: "admin-v2/sidebar-item",
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  if (options.action === "remove") {
    await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].remove();
  } else {
    await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].create();
  }

  await formatGeneratorFiles(tree);
}

export default modelGenerator;
