import { Tree, getProjects } from "@nx/devkit";
import { MigrateGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { formatGeneratorFiles } from "../format";

/**
 * Migrate module to the new version
 *
 * website-builder
 * npx nx generate @sps/sps-generator-plugin:migrate --modules=website-builder,startup,file-storage,rbac --right_external_models=file-storage-widgets,file-storage-module-widgets,rbac-module-widgets,startup-module-widgets --no-interactive --dry-run
 *
 * npx nx generate @sps/sps-generator-plugin:migrate --modules=host --no-interactive --dry-run
 */
export async function migrateGenerator(
  tree: Tree,
  options: MigrateGeneratorSchema,
) {
  const leftExternalModels = options.left_external_models?.split(",") || [];
  const rightExternalModels = options.right_external_models?.split(",") || [];

  const fullProjectSchema = getProjects(tree);
  for (const moduleName of options.modules) {
    const root = {
      libs: {
        modules: [
          {
            module: {
              name: moduleName,
              models: [],
              relations: [],
            },
          },
        ],
      },
    } as any;

    fullProjectSchema.forEach((project) => {
      const splitted = project.root.split("/");
      if (splitted[0] !== "libs") {
        return;
      }
      if (splitted?.[1] !== "modules") {
        return;
      }
      if (splitted?.[2] !== moduleName) {
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
        if (
          splitted?.[6] === "schema" &&
          splitted?.[7] === "relations" &&
          splitted?.[8] !== "root"
        ) {
          const relationName = splitted?.[8];
          const relationExistsInRoot =
            root.libs.modules[0].module.relations.find((relation) => {
              return relation.relation.name === relationName;
            });
          if (!relationExistsInRoot) {
            const modelIndex = root.libs.modules[0].module.models.findIndex(
              (model) => {
                return model.model.name === modelName;
              },
            );
            const model = root.libs.modules[0].module.models[modelIndex];
            if (!model) {
              throw new Error("model not found:" + modelName);
            }
            if (!model.model.backend) {
              model.model.backend = {};
            }
            if (!model.model.backend.schema) {
              model.model.backend.schema = {};
            }
            if (!model.model.backend.schema.relations) {
              model.model.backend.schema.relations = [];
            }
            root.libs.modules[0].module.models[
              modelIndex
            ].model.backend.schema.relations.push({
              relation: {
                name: relationName,
              },
            });
            const r = root.libs.modules[0].module.models;
          }
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
      }
    });

    const coder = new Coder({
      tree,
      root,
    });

    await coder.migrate({
      version: "0.1.0",
    });
  }

  await formatGeneratorFiles(tree);
}

export default migrateGenerator;
