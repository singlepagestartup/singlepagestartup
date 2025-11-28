import {
  ProjectConfiguration,
  Tree,
  getProjects,
  names,
  updateJson,
} from "@nx/devkit";
import * as path from "path";
import { util as createSpsTSLibrary } from "../../../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../../../utils/get-name-styles";
import { replaceInFile } from "../../../../../../../../../../utils/file-utils";
import { util as getModuleCuttedStyles } from "../../../../../../../../../utils/get-module-cutted-styles";
import { RegexCreator } from "../../../../../../../../../../utils/regex-utils/RegexCreator";
import { Coder as SchemaCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export interface IEditFieldProps {
  name: string;
  pgCoreType:
    | "real"
    | "serial"
    | "uuid"
    | "bigint"
    | "text"
    | "boolean"
    | "timestamp"
    | "jsonb"
    | "json"
    | "integer"
    | "date"
    | "time"
    | "number";
  level: "singlepage" | "startup";
  isRequired: boolean;
}

export class Coder {
  parent: SchemaCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  moduleNameCutted: ReturnType<typeof getModuleCuttedStyles>;
  project?: ProjectConfiguration;
  tableName: string;
  absoluteName: string;
  modelNameStyles: ReturnType<typeof getNameStyles>;
  importPath: string;

  constructor(props: { parent: SchemaCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${props.parent.baseName}-database`;
    this.baseDirectory = `${props.parent.baseDirectory}/database`;
    this.tree = props.tree;
    this.absoluteName = `${props.parent.absoluteName}/database`;

    this.importPath = this.absoluteName;

    const modelName = this.parent.parent.parent.name;

    const modelNameStyles = getNameStyles({
      name: modelName,
    });
    this.modelNameStyles = modelNameStyles;

    const moduleName = this.parent.parent.parent.parent.parent.name;
    this.moduleNameCutted = getModuleCuttedStyles({ name: moduleName });

    if (modelNameStyles.snakeCased.base.length > 10) {
      const randomThreeLetters = Math.random().toString(36).substring(2, 5);

      // Cutted table names can be equal, thats why we add random three letters
      this.tableName =
        modelNameStyles.snakeCased.baseCutted + "_" + randomThreeLetters;
    } else {
      this.tableName = modelNameStyles.snakeCased.base;
    }

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async migrate(props: { version: string }) {
    const migrator = new Migrator({
      coder: this,
    });

    const version = props.version as keyof typeof migrator.releases;
    await migrator.execute({ version });
  }

  async create() {
    if (this.project) {
      return;
    }

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        table_name: this.tableName,
        module_name_cutted_snake_cased: this.moduleNameCutted.snakeCased,
        module_name_cutted_pascal_cased: this.moduleNameCutted.pascalCased,
        model_name_pascal_cased: this.modelNameStyles.pascalCased.base,
        model_name_property_cased: this.modelNameStyles.propertyCased.base,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);

    await this.attach();
  }

  async attach() {
    const moduleName = this.parent.parent.parent.parent.parent.name;
    const modelName = this.modelNameStyles.snakeCased.base;
    const projectJsonPath = `libs/modules/${moduleName}/project.json`;

    // Add model specific targets and root commands
    for (const type of ["generate", "migrate"] as const) {
      // Add model specific targets
      await updateJson(this.tree, projectJsonPath, (json) => {
        const targetName = `models:${modelName}:repository-${type}`;
        const target =
          type === "generate"
            ? {
                executor: "nx:run-commands",
                options: {
                  parallel: false,
                  cwd: `libs/modules/${moduleName}/models/${modelName}/backend/repository/database`,
                  commands: [
                    {
                      command: "drizzle-kit up --config=./src/lib/config.ts",
                    },
                    {
                      command:
                        "drizzle-kit generate --config=./src/lib/config.ts",
                    },
                  ],
                },
              }
            : {
                executor: "nx:run-commands",
                cache: false,
                options: {
                  parallel: false,
                  envFile: "apps/api/.env",
                  cwd: `libs/modules/${moduleName}/models/${modelName}/backend/repository/database`,
                  commands: [
                    {
                      command: "bun run ./src/lib/migrate.ts",
                    },
                  ],
                },
              };

        // Add model specific target
        json.targets[targetName] = target;

        // Add command to root target
        const rootTargetName = `models:repository-${type}`;
        const rootTarget = json.targets[rootTargetName];

        if (rootTarget) {
          const command = `nx run @sps/${moduleName}:models:${modelName}:repository-${type}`;
          const commands = rootTarget.options.commands || [];

          if (!commands.some((cmd) => cmd.command === command)) {
            commands.push({ command });
            rootTarget.options.commands = commands;
          }
        }

        return json;
      });
    }
  }

  async detach() {
    const moduleName = this.parent.parent.parent.parent.parent.name;
    const modelName = this.modelNameStyles.snakeCased.base;
    const projectJsonPath = `libs/modules/${moduleName}/project.json`;

    // Remove model specific targets and root commands
    for (const type of ["generate", "migrate"] as const) {
      await updateJson(this.tree, projectJsonPath, (json) => {
        // Remove model specific target
        const targetName = `models:${modelName}:repository-${type}`;
        delete json.targets[targetName];

        // Remove command from root target
        const rootTargetName = `models:repository-${type}`;
        const rootTarget = json.targets[rootTargetName];

        if (rootTarget?.options?.commands) {
          const command = `nx run @sps/${moduleName}:models:${modelName}:repository-${type}`;
          rootTarget.options.commands = rootTarget.options.commands.filter(
            (cmd) => cmd.command !== command,
          );
        }

        return json;
      });
    }
  }

  async addField(props: IEditFieldProps) {
    // const { level, name, pgCoreType, isRequired } = props;
    // const schemaFilePath = `${this.baseDirectory}/src/lib/fields/${level}.ts`;
    // const fieldToAdd = new Field({
    //   name,
    //   pgCoreType,
    //   isRequired,
    // });
    // await replaceInFile({
    //   tree: this.tree,
    //   pathToFile: schemaFilePath,
    //   regex: fieldToAdd.onCreate.regex,
    //   content: fieldToAdd.onCreate.content,
    // });
    // await this.parent.parent.parent.project.contracts.project.root.addField({
    //   name,
    //   level,
    //   isRequired,
    // });
  }

  async removeField(props: IEditFieldProps) {
    // const { level, name, pgCoreType, isRequired } = props;
    // const schemaFilePath = `${this.baseDirectory}/src/lib/fields/${level}.ts`;
    // await this.parent.parent.parent.project.project.root.removeField({
    //   name,
    //   level,
    //   isRequired,
    // });
    // const fieldToAdd = new Field({
    //   name,
    //   pgCoreType,
    //   isRequired,
    // });
    // try {
    //   await replaceInFile({
    //     tree: this.tree,
    //     pathToFile: schemaFilePath,
    //     regex: fieldToAdd.onRemove.regex,
    //     content: fieldToAdd.onRemove.content,
    //   });
    // } catch (error: any) {
    //   if (!error.message.includes("No expected value")) {
    //     throw error;
    //   }
    // }
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }
}

export class Field extends RegexCreator {
  constructor(props: {
    name: string;
    pgCoreType: string;
    isRequired: boolean;
  }) {
    const place = "export const fields = {";
    const placeRegex = new RegExp("export const fields = {");

    const fieldNameCamelCase = names(props.name).propertyName;
    const content = `${fieldNameCamelCase}: pgCore.${props.pgCoreType}("${props.name}")${props.isRequired ? ".notNull()" : ""},`;

    const contentRegex = new RegExp(
      `${fieldNameCamelCase}: pgCore.${props.pgCoreType}\\("${props.name}"\\)${props.isRequired ? ".notNull\\(\\)" : ""},`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
