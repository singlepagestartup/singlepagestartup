import { FrontendComponentVariantGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { Tree } from "@nx/devkit";

// npx nx generate @sps/sps-generator-plugin:frontend-component-variant --name=get-layout --entity_name=pages-to-layouts --action=create --level=sps-lite --module_name=sps-website-builder --type=relation --no-interactive --dry-run
export async function frontendComponentVariantGenerator(
  tree: Tree,
  options: FrontendComponentVariantGeneratorSchema,
) {
  const name = options.name;
  const level = options.level;
  const entityName = options.entity_name;
  const moduleName = options.module_name;

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
      await coder.removeModelFrontendComponentVariant({
        name,
        level,
      });
    } else {
      await coder.createModelFrontendComponentVariant({
        name,
        level,
        templateName: options.template,
      });
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
}

export default frontendComponentVariantGenerator;
