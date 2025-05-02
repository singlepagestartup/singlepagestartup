import { Tree, formatFiles } from "@nx/devkit";
import { RelationGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import pluralize from "pluralize";
// import { IGeneratorProps as IModelFrontendComponentVariantGeneratorProps } from "../../coder/root/libs/modules/[module]/relations/[relation]/frontend/component/variants/[level]/[variant]/Coder";

// npx nx generate @sps/sps-generator-plugin:relation --action=create --left_model_name=widget --right_model_name=banner --module=social --dry-run
export async function relationGenerator(
  tree: Tree,
  options: RelationGeneratorSchema,
) {
  // const moduleName = options.module;
  // const leftModelName = pluralize(options.left_model_name);
  // const rightModelName = pluralize(options.right_model_name);

  // const name = `${leftModelName}-to-${rightModelName}`;

  // const relationAdminVariants: IModelFrontendComponentVariantGeneratorProps[] =
  //   [
  //     {
  //       name: "default",
  //       level: "sps-lite",
  //     },
  //     {
  //       template: "admin-form",
  //       name: "admin-form",
  //       level: "sps-lite",
  //     },
  //     {
  //       template: "admin-select-input",
  //       name: "admin-select-input",
  //       level: "sps-lite",
  //     },
  //     {
  //       template: "admin-table",
  //       name: "admin-table",
  //       level: "sps-lite",
  //     },
  //     {
  //       template: "admin-table-row",
  //       name: "admin-table-row",
  //       level: "sps-lite",
  //     },
  //   ];

  const coder = new Coder({
    tree,
    root: {
      libs: {
        modules: [
          {
            module: {
              name: "rbac",
              relations: [
                {
                  relation: {
                    name: "subjects-to-ecommerce-module-products",
                    models: [
                      {
                        name: "subject",
                        module: "rbac",
                      },
                      {
                        name: "product",
                        module: "ecommerce",
                      },
                    ],
                    frontend: {
                      component: {
                        variants: [
                          {
                            name: "default",
                            level: "singlepage",
                            template: "default",
                            path: "default",
                          },
                          {
                            name: "find",
                            level: "singlepage",
                            template: "find",
                            path: "find",
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
                            name: "admin-table-row",
                            level: "singlepage",
                            template: "admin-table-row",
                            path: "admin/table-row",
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
    const relations =
      coder.project.root.project.libs.project.modules[0].project.module.project
        .relations;

    if (relations) {
      for (const relation of relations) {
        await relation.project.relation.remove();
      }
    }
  } else {
    const relations =
      coder.project.root.project.libs.project.modules[0].project.module.project
        .relations;

    if (relations) {
      for (const relation of relations) {
        await relation.project.relation.create();
      }
    }
  }

  await formatFiles(tree);
}

export default relationGenerator;
