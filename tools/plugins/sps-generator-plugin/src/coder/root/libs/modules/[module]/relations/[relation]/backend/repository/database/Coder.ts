import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import path from "path";
import { util as createSpsTSLibrary } from "tools/plugins/sps-generator-plugin/src/utils/create-sps-ts-library";
import * as nxWorkspace from "@nx/workspace";
import { util as getNameStyles } from "../../../../../../../../../utils/get-name-styles";
import { util as getModuleCuttedStyles } from "../../../../../../../../../utils/get-module-cutted-styles";
import { RegexCreator } from "tools/plugins/sps-generator-plugin/src/utils/regex-utils/RegexCreator";
import {
  addToFile,
  replaceInFile,
} from "tools/plugins/sps-generator-plugin/src/utils/file-utils";
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
  exportAll?: ExportNamedVariables;
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

  async setReplacers() {
    // const moduleName = this.parent.parent.parent.parent.parent.name;
    // const leftModelName =
    //   this.parent.parent.parent.parent.parent.project.models[0].project.model
    //     .project.backend.project.model.modelName;
    // const rightModelName =
    //   this.parent.parent.parent.parent.parent.project.models[1].project.model
    //     .project.backend.project.model.modelName;
    // const relationName = this.parent.parent.parent.name;
    // const leftModelStyles = getNameStyles({
    //   name: leftModelName,
    // });
    // const rightModelStyles = getNameStyles({
    //   name: rightModelName,
    // });
    // this.leftModelStyles = leftModelStyles;
    // this.rightModelStyles = rightModelStyles;
    // this.moduleNameStyles = getModuleCuttedStyles({ name: moduleName });
    // this.relationNameStyles = getNameStyles({ name: relationName });
    // const tableName = this.relationNameStyles.base;
    // if (tableName.length > 10) {
    //   const cuttedTableName = getNameStyles({ name: tableName }).snakeCased
    //     .baseCutted;
    //   const randomThreeLetters = Math.random().toString(36).substring(2, 5);
    //   // Cutted table names can be equal, thats why we add random three letters
    //   this.tableName = cuttedTableName + "_" + randomThreeLetters;
    // } else {
    //   this.tableName = tableName;
    // }
    // this.leftModelTableUuidName = `${
    //   getNameStyles({
    //     name: this.leftModelStyles.snakeCased.base,
    //   }).snakeCased.baseCutted
    // }_id`;
    // this.rightModelTableUuidName = `${
    //   getNameStyles({
    //     name: this.rightModelStyles.snakeCased.base,
    //   }).snakeCased.baseCutted
    // }_id`;
    // this.exportAll = new ExportNamedVariables({
    //   importPath: this.importPath,
    //   moduleNamePascalCased: this.moduleNameStyles.pascalCased,
    //   relationNamePascalCased: this.relationNameStyles.pascalCased.base,
    // });
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

    const leftModelModuleName =
      this.parent.parent.parent.parent.project.relation.models[0].module;
    const leftModelName =
      this.parent.parent.parent.parent.project.relation.models[0].name;

    const leftModelNameStyles = getNameStyles({
      name: leftModelName,
    });

    const leftModelBackendRepositoryDatabaseImportPath = `@sps/${leftModelModuleName}/models/${leftModelName}/backend/repository/database`;
    const leftModelNamePascalCased = leftModelNameStyles.pascalCased.base;
    const leftModelIdColumnName = `${leftModelNameStyles.snakeCased.baseCutted}_id`;
    const leftModelIdFieldName = `${leftModelNameStyles.propertyCased.base}Id`;

    const rightModelModuleName =
      this.parent.parent.parent.parent.project.relation.models[1].module;
    const rightModelName =
      this.parent.parent.parent.parent.project.relation.models[1].name;
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
    // const moduleSchemaRootPath = path.join(
    //   this.parent.parent.parent.parent.parent.project.backend.project.schema
    //     .project.root.baseDirectory,
    //   "/src/lib/index.ts",
    // );
    // if (!this.exportAll) {
    //   throw new Error("ExportAll is not defined");
    // }
    // await addToFile({
    //   toTop: true,
    //   pathToFile: moduleSchemaRootPath,
    //   content: this.exportAll.onCreate.content,
    //   tree: this.tree,
    // });
  }

  async detach() {
    // const moduleSchemaRootPath = path.join(
    //   this.parent.parent.parent.parent.parent.project.backend.project.schema
    //     .project.root.baseDirectory,
    //   "/src/lib/index.ts",
    // );
    // if (!this.exportAll) {
    //   throw new Error("ExportAll is not defined");
    // }
    // try {
    //   await replaceInFile({
    //     tree: this.tree,
    //     pathToFile: moduleSchemaRootPath,
    //     regex: this.exportAll.onRemove.regex,
    //     content: "",
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

export class ExportNamedVariables extends RegexCreator {
  constructor(props: {
    importPath: string;
    moduleNamePascalCased: string;
    relationNamePascalCased: string;
  }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `export { Table as ${props.moduleNamePascalCased}${props.relationNamePascalCased}, Relations as ${props.moduleNamePascalCased}${props.relationNamePascalCased}Relations } from "${props.importPath}";`;
    const contentRegex = new RegExp(
      `export([\\s]+?)?{([\\s]+?)?Table([\\s]+?)?as([\\s]+?)?${props.moduleNamePascalCased}${props.relationNamePascalCased},([\\s]+?)?Relations as ${props.moduleNamePascalCased}${props.relationNamePascalCased}Relations([,]?)([\\s]+?)?}([\\s]+?)?from([\\s]+?)?"${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
