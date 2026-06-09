import { Tree } from "@nx/devkit";
import { SchemaFieldGeneratorSchema } from "./schema";
import { Coder } from "../../coder/Coder";
import { formatGeneratorFiles } from "../format";

export async function schemaFieldGenerator(
  tree: Tree,
  options: SchemaFieldGeneratorSchema,
) {
  const coder = new Coder({
    tree,
    root: {
      libs: {
        modules: [
          {
            module: {
              name: options.module,
              models: [
                {
                  model: {
                    name: options.model_name,
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
    await coder.removeField({
      name: options.name,
      level: options.level,
      pgCoreType: options.pg_core_type,
      isRequired: options.is_required,
    });
  } else {
    await coder.addField({
      name: options.name,
      pgCoreType: options.pg_core_type,
      level: options.level,
      isRequired: options.is_required,
    });
  }

  await formatGeneratorFiles(tree);
}

export default schemaFieldGenerator;
