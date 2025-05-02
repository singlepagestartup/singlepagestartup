import { Tree, formatFiles } from "@nx/devkit";
import { ModelGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";

// npx nx generate @sps/sps-generator-plugin:model --name=test-model --action=create --module=startup --no-interactive --dry-run
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

  await formatFiles(tree);
}

export default modelGenerator;
