import {
  ProjectConfiguration,
  Tree,
  getProjects,
  updateJson,
} from "@nx/devkit";
import path from "path";
import { util as createSpsTSLibrary } from "tools/plugins/sps-generator-plugin/src/utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../../../utils/get-name-styles";
import { util as getModuleCuttedStyles } from "../../../../../../../../../utils/get-module-cutted-styles";
import { Coder as SchemaCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  name: string;
  parent: SchemaCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  project?: ProjectConfiguration;
  leftModelStyles?: ReturnType<typeof getNameStyles>;
  rightModelStyles?: ReturnType<typeof getNameStyles>;
  moduleNameStyles?: ReturnType<typeof getModuleCuttedStyles>;
  relationNameStyles?: ReturnType<typeof getNameStyles>;
  absoluteName: string;
  tableName?: string;
  leftModelTableUuidName?: string;
  rightModelTableUuidName?: string;
  importPath: string;

  constructor(props: { parent: SchemaCoder; tree: Tree } & IGeneratorProps) {
    this.name = "database";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${this.parent.baseName}`;
    this.baseDirectory = `${this.parent.baseDirectory}/database`;
    this.absoluteName = `${this.parent.absoluteName}/database`;

    this.importPath = this.absoluteName;

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

    const relationName = this.parent.parent.parent.name;

    const leftModel =
      this.parent.parent.parent.parent.project.relation.models[0];

    const leftModelModuleName = leftModel.module;
    const leftModelName = leftModel.name;

    const leftModelNameStyles = getNameStyles({
      name: leftModelName,
    });

    const leftModelBackendRepositoryDatabaseImportPath = `@sps/${leftModelModuleName}/models/${leftModelName}/backend/repository/database`;
    const leftModelNamePascalCased = leftModelNameStyles.pascalCased.base;
    const leftModelIdColumnName = `${leftModelNameStyles.snakeCased.baseCutted}_id`;
    const leftModelIdFieldName = `${leftModelNameStyles.propertyCased.base}Id`;

    const rightModel =
      this.parent.parent.parent.parent.project.relation.models[1];

    const rightModelModuleName = rightModel.module;
    const rightModelName = rightModel.name;
    const rightModelNameStyles = getNameStyles({
      name: rightModelName,
    });

    const rightModelBackendRepositoryDatabaseImportPath = `@sps/${rightModelModuleName}/models/${rightModelName}/backend/repository/database`;
    const rightModelNamePascalCased = rightModelNameStyles.pascalCased.base;
    const rightModelIdColumnName = `${rightModelNameStyles.snakeCased.baseCutted}_id`;
    const rightModelIdFieldName = `${rightModelNameStyles.propertyCased.base}Id`;

    const relationNameStyles = getNameStyles({ name: relationName });
    const tableName = relationNameStyles.base;
    if (tableName.length > 10) {
      const cuttedTableName = getNameStyles({ name: tableName }).snakeCased
        .baseCutted;
      const randomThreeLetters = Math.random().toString(36).substring(2, 5);
      // Cutted table names can be equal, thats why we add random three letters
      this.tableName = cuttedTableName + "_" + randomThreeLetters;
    } else {
      this.tableName = tableName;
    }

    const moduleName = this.parent.parent.parent.parent.parent.name;

    const moduleNameStyles = getModuleCuttedStyles({ name: moduleName });

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        left_model_backend_repository_database_import_path:
          leftModelBackendRepositoryDatabaseImportPath,
        right_model_backend_repository_database_import_path:
          rightModelBackendRepositoryDatabaseImportPath,
        left_model_name_pascal_cased: leftModelNamePascalCased,
        right_model_name_pascal_cased: rightModelNamePascalCased,
        table_name: this.tableName,
        module_name_cutted_snake_cased: moduleNameStyles.snakeCased,
        left_model_id_field_name: leftModelIdFieldName,
        left_model_id_column_name: leftModelIdColumnName,
        right_model_id_field_name: rightModelIdFieldName,
        right_model_id_column_name: rightModelIdColumnName,
      },
    });

    await this.attach();

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async attach() {
    const relationName = this.parent.parent.parent.name;
    const relationNameStyles = getNameStyles({ name: relationName });
    const moduleName = this.parent.parent.parent.parent.parent.name;
    const projectJsonPath = `libs/modules/${moduleName}/project.json`;

    // Add model specific targets and root commands
    for (const type of ["generate", "migrate"] as const) {
      // Add model specific targets
      await updateJson(this.tree, projectJsonPath, (json) => {
        const targetName = `relations:${relationNameStyles.kebabCased.base}:repository-${type}`;
        const target =
          type === "generate"
            ? {
                executor: "nx:run-commands",
                options: {
                  parallel: false,
                  cwd: `libs/modules/${moduleName}/relations/${relationNameStyles.kebabCased.base}/backend/repository/database`,
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
                  cwd: `libs/modules/${moduleName}/relations/${relationNameStyles.kebabCased.base}/backend/repository/database`,
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
        const rootTargetName = `relations:repository-${type}`;
        const rootTarget = json.targets[rootTargetName];

        if (rootTarget) {
          const command = `nx run @sps/${moduleName}:relations:${relationNameStyles.kebabCased.base}:repository-${type}`;
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
    const relationName = this.parent.parent.parent.name;
    const relationNameStyles = getNameStyles({ name: relationName });
    const moduleName = this.parent.parent.parent.parent.parent.name;
    const projectJsonPath = `libs/modules/${moduleName}/project.json`;

    // Remove model specific targets and root commands
    for (const type of ["generate", "migrate"] as const) {
      await updateJson(this.tree, projectJsonPath, (json) => {
        // Remove model specific target
        const targetName = `relations:${relationNameStyles.kebabCased.base}:repository-${type}`;
        delete json.targets[targetName];

        // Remove command from root target
        const rootTargetName = `relations:repository-${type}`;
        const rootTarget = json.targets[rootTargetName];

        if (rootTarget?.options?.commands) {
          const command = `nx run @sps/${moduleName}:relations:${relationNameStyles.kebabCased.base}:repository-${type}`;
          rootTarget.options.commands = rootTarget.options.commands.filter(
            (cmd) => cmd.command !== command,
          );
        }

        return json;
      });
    }
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }
}
