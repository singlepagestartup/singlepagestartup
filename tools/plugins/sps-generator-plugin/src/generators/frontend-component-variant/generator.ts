import { FrontendComponentVariantGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { Tree } from "@nx/devkit";
import pluralize from "pluralize";
import { formatGeneratorFiles } from "../format";

type RelationModel = {
  name: string;
  module: string;
};

// npx nx generate @sps/sps-generator-plugin:frontend-component-variant find --level=singlepage --module=rbac --type=model --action=create --path=find --template=find --entity=widget --no-interactive --dry-run
export async function frontendComponentVariantGenerator(
  tree: Tree,
  options: FrontendComponentVariantGeneratorSchema,
) {
  const name = options.name;
  const level = options.level;
  const entityName = options.entity;
  const moduleName = options.module;
  const path = options.path;
  const template = options.template || "default";

  if (options.type === "model") {
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
                      name: entityName,
                      frontend: {
                        component: {
                          variants: [
                            {
                              name,
                              level,
                              template,
                              path,
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
      await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].project.model.project.frontend.project.component.removeVariant(
        {
          name,
          level,
          template: template || "default",
          path,
        },
      );
    } else {
      await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].project.model.project.frontend.project.component.createVariant(
        {
          name,
          level,
          template: template || "default",
          path,
        },
      );
    }
  } else if (options.type === "relation") {
    const relationModels = resolveRelationModels({
      tree,
      moduleName,
      relationName: entityName,
      options,
    });

    const coder = new Coder({
      tree,
      root: {
        libs: {
          modules: [
            {
              module: {
                name: moduleName,
                relations: [
                  {
                    relation: {
                      name: entityName,
                      models: relationModels,
                      frontend: {
                        component: {
                          variants: [
                            {
                              name,
                              level,
                              template,
                              path,
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

    const component =
      coder.project.root.project.libs.project.modules[0].project.module.project
        .relations[0].project.relation.project.frontend.project.component;

    if (options.action === "remove") {
      await component.removeVariant({
        name,
        level,
        template: template || "default",
        path,
      });
    } else {
      await component.createVariant({
        name,
        level,
        template: template || "default",
        path,
      });
    }
  }

  await formatGeneratorFiles(tree);
}

export default frontendComponentVariantGenerator;

function resolveRelationModels(props: {
  tree: Tree;
  moduleName: string;
  relationName: string;
  options: FrontendComponentVariantGeneratorSchema;
}): RelationModel[] {
  const explicitModels = getExplicitRelationModels(props.options);

  if (explicitModels) {
    return explicitModels;
  }

  const schemaPath = `libs/modules/${props.moduleName}/relations/${props.relationName}/backend/repository/database/src/lib/schema.ts`;
  const schema = props.tree.read(schemaPath)?.toString("utf8");

  if (schema) {
    const imports = Array.from(
      schema.matchAll(
        /@sps\/([^/]+)\/models\/([^/]+)\/backend\/repository\/database/g,
      ),
    ).map((match) => ({
      module: match[1],
      name: match[2],
    }));

    if (imports.length >= 2) {
      return imports.slice(0, 2);
    }
  }

  return inferRelationModelsFromName({
    moduleName: props.moduleName,
    relationName: props.relationName,
  });
}

function getExplicitRelationModels(
  options: FrontendComponentVariantGeneratorSchema,
): RelationModel[] | null {
  if (
    !options.left_model_name ||
    !options.right_model_name ||
    !options.left_module_name ||
    !options.right_module_name
  ) {
    return null;
  }

  return [
    {
      name: options.left_model_name,
      module: options.left_module_name,
    },
    {
      name: options.right_model_name,
      module: options.right_module_name,
    },
  ];
}

function inferRelationModelsFromName(props: {
  moduleName: string;
  relationName: string;
}): RelationModel[] {
  const [leftModelPluralized, ...rightModelNameParts] =
    props.relationName.split("-to-");
  const rightModelPluralized = rightModelNameParts.join("-to-");

  if (!leftModelPluralized || !rightModelPluralized) {
    throw new Error(
      `Cannot infer relation models from relation name "${props.relationName}". Provide left/right model and module overrides.`,
    );
  }

  return [
    inferRelationModelFromNamePart({
      moduleName: props.moduleName,
      namePart: leftModelPluralized,
    }),
    inferRelationModelFromNamePart({
      moduleName: props.moduleName,
      namePart: rightModelPluralized,
    }),
  ];
}

function inferRelationModelFromNamePart(props: {
  moduleName: string;
  namePart: string;
}): RelationModel {
  const moduleMarker = "-module-";

  if (props.namePart.includes(moduleMarker)) {
    const [moduleName, modelNamePluralized] =
      props.namePart.split(moduleMarker);

    return {
      module: moduleName,
      name: pluralize.singular(modelNamePluralized),
    };
  }

  return {
    module: props.moduleName,
    name: pluralize.singular(props.namePart),
  };
}
