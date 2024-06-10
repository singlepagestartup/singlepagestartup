import { ProjectConfiguration, Tree, getProjects, names } from "@nx/devkit";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { util as createSpsTSLibrary } from "../../../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../../../utils/get-name-styles";
import { replaceInFile } from "../../../../../../../../../../utils/file-utils";
import { util as getModuleCuttedStyles } from "../../../../../../../../../utils/get-module-cutted-styles";
import { RegexCreator } from "../../../../../../../../../../utils/regex-utils/RegexCreator";
import { Coder as SchemaCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = {};

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
  level: "sps-lite" | "startup";
  isRequired: boolean;
}

export class Coder {
  parent: SchemaCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  modelName: string;
  modelNameSnakeCased: string;
  moduleAndModelNamePascalCased: string;
  moduleNameStyles: ReturnType<typeof getModuleCuttedStyles>;
  project?: ProjectConfiguration;
  tableName: string;
  modelNameStyles: ReturnType<typeof getNameStyles>;

  constructor(props: { parent: SchemaCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${props.parent.baseName}-table`;
    this.baseDirectory = `${props.parent.baseDirectory}/table`;
    this.tree = props.tree;

    const modelName = this.parent.parent.parent.name;

    const modelNameStyles = getNameStyles({
      name: modelName,
    });
    this.modelNameStyles = modelNameStyles;

    const moduleName = this.parent.parent.parent.parent.parent.name;
    this.moduleNameStyles = getModuleCuttedStyles({ name: moduleName });

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

  async update() {
    const migrator = new Migrator({
      coder: this,
    });

    const version = "0.0.156";
    await migrator.execute({ version });
  }

  async create() {
    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        table_name: this.tableName,
        module_name_cutted_snake_cased: this.moduleNameStyles.snakeCased,
        module_name_cutted_pascal_cased: this.moduleNameStyles.pascalCased,
        model_name_pascal_cased: this.modelNameStyles.pascalCased.base,
        model_name_property_cased: this.modelNameStyles.propertyCased.base,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async addField(props: IEditFieldProps) {
    const { level, name, pgCoreType, isRequired } = props;

    const schemaFilePath = `${this.baseDirectory}/src/lib/fields/${level}.ts`;

    const fieldToAdd = new Field({
      name,
      pgCoreType,
      isRequired,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: schemaFilePath,
      regex: fieldToAdd.onCreate.regex,
      content: fieldToAdd.onCreate.content,
    });

    await this.parent.parent.parent.project.contracts.project.root.addField({
      name,
      level,
      isRequired,
    });
  }

  async removeField(props: IEditFieldProps) {
    const { level, name, pgCoreType, isRequired } = props;

    const schemaFilePath = `${this.baseDirectory}/src/lib/fields/${level}.ts`;

    await this.parent.parent.parent.project.contracts.project.root.removeField({
      name,
      level,
      isRequired,
    });

    const fieldToAdd = new Field({
      name,
      pgCoreType,
      isRequired,
    });

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: schemaFilePath,
        regex: fieldToAdd.onRemove.regex,
        content: fieldToAdd.onRemove.content,
      });
    } catch (error) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }
}

export class Field extends RegexCreator {
  constructor({
    name,
    pgCoreType,
    isRequired,
  }: {
    name: string;
    pgCoreType: string;
    isRequired: boolean;
  }) {
    const place = `export const fields = {`;
    const placeRegex = new RegExp(`export const fields = {`);

    const fieldNameCamelCase = names(name).propertyName;
    const content = `${fieldNameCamelCase}: pgCore.${pgCoreType}("${name}")${isRequired ? ".notNull()" : ""},`;

    const contentRegex = new RegExp(
      `${fieldNameCamelCase}: pgCore.${pgCoreType}\\("${name}"\\)${isRequired ? ".notNull\\(\\)" : ""},`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
