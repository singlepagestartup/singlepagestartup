import { FrontendComponentVariantGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { Tree, formatFiles } from "@nx/devkit";

// npx nx generate @sps/sps-generator-plugin:frontend-component-variant --name=get-layout --entity_name=pages-to-layouts --action=create --level=sps-lite --module_name=sps-website-builder --type=relation --no-interactive --dry-run
export async function frontendComponentVariantGenerator(
  tree: Tree,
  options: FrontendComponentVariantGeneratorSchema,
) {
  const name = options.name;
  const level = options.level;
  const entityName = options.entity_name;
  const moduleName = options.module_name;
  const template = options.template || undefined;

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
      await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].project.model.project.frontend.project.component.project.variants[0].remove();
    } else {
      await coder.project.root.project.libs.project.modules[0].project.module.project.models[0].project.model.project.frontend.project.component.project.variants[0].create();
    }
  } else if (options.type === "relation") {
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
      await coder.removeRelationFrontendComponentVariant({
        name,
        level,
      });
    } else {
      await coder.createRelationFrontendComponentVariant({
        name,
        level,
        templateName: options.template,
      });
    }
  }

  await formatFiles(tree);
}

export default frontendComponentVariantGenerator;
