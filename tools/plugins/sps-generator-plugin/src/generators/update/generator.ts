import { Tree, getProjects } from "@nx/devkit";
import { UpdateGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";

export async function updateGenerator(
  tree: Tree,
  options: UpdateGeneratorSchema,
) {
  const fullProjectSchema = getProjects(tree);

  const root = {
    libs: {
      modules: [
        {
          module: {
            name: "sps-website-builder",
            models: [],
            relations: [],
          },
        },
      ],
    },
  };

  fullProjectSchema.forEach((project) => {
    const splitted = project.root.split("/");
    if (splitted[0] !== "libs") {
      return;
    }

    if (splitted?.[1] !== "modules") {
      return;
    }

    if (splitted?.[2] !== "sps-website-builder") {
      return;
    }

    if (splitted?.[3] === "models") {
      const modelName = splitted?.[4];

      const modelExistsInRoot = root.libs.modules[0].module.models.find(
        (model) => {
          return model.model.name === modelName;
        },
      );

      if (!modelExistsInRoot) {
        root.libs.modules[0].module.models.push({
          model: {
            name: modelName,
          },
        });
      }

      if (splitted?.[7] === "variants") {
        const level = splitted?.[8];
        const variant = splitted?.[9];

        if (!variant || !level) {
          throw new Error("variant or level is missing:" + splitted);
        }

        const model = root.libs.modules[0].module.models.find((model) => {
          return model.model.name === modelName;
        });

        if (!model) {
          throw new Error("model not found:" + modelName);
        }

        if (!model.model.frontend) {
          model.model.frontend = {};
        }

        if (!model.model.frontend.component) {
          model.model.frontend.component = {};
        }

        if (!model.model.frontend.component.variants) {
          model.model.frontend.component.variants = [];
        }

        const variantExists = model.model.frontend.component.variants.find(
          (v: { name: string; level: string }) => {
            return v.name === variant;
          },
        );

        if (!variantExists) {
          model.model.frontend.component.variants.push({
            name: variant,
            level,
          });
        }
      }
    }

    if (splitted?.[3] === "relations") {
      const relationName = splitted?.[4];

      const relationExistsInRoot = root.libs.modules[0].module.relations.find(
        (relation) => {
          return relation.relation.name === relationName;
        },
      );

      if (!relationExistsInRoot) {
        const leftExternalModels = [];
        const rightExternalModels = [
          "sps-file-storage-widgets",
          "sps-file-storage-module-widgets",
          "sps-rbac-module-widgets",
          "startup-module-widgets",
        ];

        let leftModelIsExternal = false;
        for (const externalModel of leftExternalModels) {
          if (relationName.includes(externalModel)) {
            leftModelIsExternal = true;
          }
        }
        let rightModelIsExternal = false;
        for (const externalModel of rightExternalModels) {
          if (relationName.includes(externalModel)) {
            rightModelIsExternal = true;
          }
        }

        root.libs.modules[0].module.relations.push({
          relation: {
            name: relationName,
            leftModelIsExternal,
            rightModelIsExternal,
          },
        });
      }

      if (splitted?.[7] === "variants") {
        const level = splitted?.[8];
        const variant = splitted?.[9];

        if (!variant || !level) {
          throw new Error("variant or level is missing:" + splitted);
        }

        const relation = root.libs.modules[0].module.relations.find(
          (relation) => {
            return relation.relation.name === relationName;
          },
        );

        if (!relation) {
          throw new Error("relation not found:" + relationName);
        }

        if (!relation.relation.frontend) {
          relation.relation.frontend = {};
        }

        if (!relation.relation.frontend.component) {
          relation.relation.frontend.component = {};
        }

        if (!relation.relation.frontend.component.variants) {
          relation.relation.frontend.component.variants = [];
        }

        const variantExists =
          relation.relation.frontend.component.variants.find(
            (v: { name: string; level: string }) => {
              return v.name === variant;
            },
          );

        if (!variantExists) {
          relation.relation.frontend.component.variants.push({
            name: variant,
            level,
          });
        }
      }

      // console.log(
      //   `🚀 ~ fullProjectSchema.forEach ~ relationName:`,
      //   relationName,
      // );
      // console.log(`🚀 ~ fullProjectSchema.forEach ~ project:`, project.root);
    }

    // console.log(`🚀 ~ fullProjectSchema.forEach ~ modelName:`, modelName);
  });

  // console.log(
  //   `🚀 ~ fullProjectSchema.forEach ~ project:`,
  //   JSON.stringify(root.libs.modules[0].module.relations, null, 2),
  // );

  const coder = new Coder({
    tree,
    root,
  });

  await coder.update();

  // const coder = new Coder({
  //   tree,
  //   root: {
  //     libs: {
  //       modules: [
  //         {
  //           module: {
  //             name: options.module,
  //             models: [
  //               // {
  //               //   model: {
  //               //     name: options.model_name,
  //               //     frontend: {
  //               //       component: {
  //               //         variants: [
  //               //           { name: "admin-form", level: "sps-lite" },
  //               //           { name: "admin-form-inputs", level: "sps-lite" },
  //               //           { name: "admin-panel", level: "sps-lite" },
  //               //           { name: "admin-select-input", level: "sps-lite" },
  //               //           { name: "admin-table", level: "sps-lite" },
  //               //           { name: "admin-table-row", level: "sps-lite" },
  //               //           { name: "default", level: "sps-lite" },
  //               //           { name: "get-by-url", level: "sps-lite" },
  //               //           { name: "get-query-from-url", level: "sps-lite" },
  //               //           { name: "get-url-model-id", level: "sps-lite" },
  //               //         ],
  //               //       },
  //               //     },
  //               //   },
  //               // },
  //             ],
  //             relations: [
  //               {
  //                 relation: {
  //                   name: "hero-section-blocks-to-sps-file-storage-widgets",
  //                   rightModelIsExternal: true,
  //                   // frontend: {
  //                   //   component: {
  //                   //     variants: [
  //                   //       {
  //                   //         name: "default",
  //                   //         level: "sps-lite",
  //                   //       },
  //                   //     ],
  //                   //   },
  //                   // },
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  // });
  // await coder.update();

  // const coder = new Coder({
  //   tree,
  //   root: {
  //     libs: {
  //       modules: [
  //         {
  //           module: {
  //             name: "sps-website-builder",
  //             models: [
  //               {
  //                 model: {
  //                   name: "button",
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  // });
  // await coder.update();

  // const models = [
  //   "logotypes-list-block",
  //   "metatag",
  //   "modal",
  //   "not-found-block",
  // ];
  // for (const model of models) {
  //   await crateForgottenModules({
  //     moduleName: "sps-website-builder",
  //     tree,
  //     modelName: model,
  //   });
  // }
}

export default updateGenerator;

async function crateForgottenModules({
  tree,
  modelName,
  moduleName,
}: {
  tree: Tree;
  moduleName: string;
  modelName: string;
}) {
  const additions = new Coder({
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
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await additions.project.root.project.libs.project.modules[0].project.module.project.models[0].project.model.project.backend.create();
}
