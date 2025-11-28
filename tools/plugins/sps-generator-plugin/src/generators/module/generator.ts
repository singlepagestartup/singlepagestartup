import { Tree, formatFiles } from "@nx/devkit";
import { ModuleGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";

// npx nx generate @sps/sps-generator-plugin:module --module=host --action=create --no-interactive --dry-run
export async function moduleGenerator(
  tree: Tree,
  options: ModuleGeneratorSchema,
) {
  const moduleName = options.module;

  const coder = new Coder({
    tree,
    root: {
      libs: {
        modules: [
          {
            module: {
              name: moduleName,
              // models: [
              //   {
              //     model: {
              //       name: "channel",
              //       frontend: {
              //         component: {
              //           variants: [
              //             {
              //               name: "default",
              //               level: "sps-lite",
              //             },
              //             {
              //               template: "admin-form",
              //               name: "admin-form",
              //               level: "sps-lite",
              //             },
              //             {
              //               template: "admin-select-input",
              //               name: "admin-select-input",
              //               level: "sps-lite",
              //             },
              //             {
              //               template: "admin-table",
              //               name: "admin-table",
              //               level: "sps-lite",
              //             },
              //             {
              //               template: "admin-table-row",
              //               name: "admin-table-row",
              //               level: "sps-lite",
              //             },
              //             { template: "find", name: "find", level: "sps-lite" },
              //             {
              //               template: "find-by-id",
              //               name: "find-by-id",
              //               level: "sps-lite",
              //             },
              //           ],
              //         },
              //       },
              //     },
              //   },
              // ],
            },
          },
        ],
      },
    },
  });

  if (options.action === "remove") {
    await coder.project.root.project.libs.project.modules[0].remove();
  } else {
    await coder.project.root.project.libs.project.modules[0].create();
  }

  await formatFiles(tree);
}

export default moduleGenerator;
