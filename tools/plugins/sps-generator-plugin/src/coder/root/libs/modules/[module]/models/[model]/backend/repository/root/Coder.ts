import { ProjectConfiguration, Tree, getProjects, names } from "@nx/devkit";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { util as createSpsTSLibrary } from "../../../../../../../../../../utils/create-sps-ts-library";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../../../utils/file-utils";
import { RegexCreator } from "../../../../../../../../../../utils/regex-utils/RegexCreator";
import { util as getModuleCuttedStyles } from "../../../../../../../../../utils/get-module-cutted-styles";
import { Coder as SchemaCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  parent: SchemaCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  name: string;
  project?: ProjectConfiguration;
  absoluteName: string;
  exportTableAndVaritantEnumTable: ExportTableAndVaritantEnumTable;
  importPath: string;

  constructor(props: { parent: SchemaCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}`;
    this.baseDirectory = `${this.parent.baseDirectory}/root`;
    this.tree = props.tree;
    this.name = "schema";
    this.absoluteName = `${this.parent.absoluteName}/root`;

    this.importPath = this.absoluteName;

    const moduleName = this.parent.parent.parent.parent.parent.name;
    const moduleNameCuttedAndPascalCased = getModuleCuttedStyles({
      name: moduleName,
    }).pascalCased;

    const modelName = this.parent.parent.parent.name;
    const modelNamePascalCased = names(modelName).className;

    this.exportTableAndVaritantEnumTable = new ExportTableAndVaritantEnumTable({
      moduleName: moduleNameCuttedAndPascalCased,
      modelNamePascalCased,
      importPath: this.importPath,
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async migrate(props: { version: string }) {
    const migrator = new Migrator({
      coder: this,
    });

    const version = props.version as keyof typeof migrator.releases;
    await migrator.execute({ version });
  }

  async attach({ indexPath }: { indexPath: string }) {
    const backendAppProjectFileContent = await addToFile({
      toTop: true,
      pathToFile: indexPath,
      content: this.exportTableAndVaritantEnumTable.onCreate.content,
      tree: this.tree,
    });
  }

  async detach({ indexPath }: { indexPath: string }) {
    try {
      const replaceImportRoutes = await replaceInFile({
        tree: this.tree,
        pathToFile: indexPath,
        regex: this.exportTableAndVaritantEnumTable.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }
  }

  async create() {
    if (this.project) {
      return;
    }

    const tableImportPath = this.parent.project.table.absoluteName;
    const relationsImportPath =
      this.parent.project.relations.project.root.importPath;
    const moduleBackendSchemaRootDirectory =
      this.parent.parent.parent.parent.parent.project.backend.project.schema
        .project.root.baseDirectory;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        table_import_path: tableImportPath,
        relations_import_path: relationsImportPath,
      },
    });

    await this.attach({
      indexPath: path.join(
        moduleBackendSchemaRootDirectory,
        `/src/lib/index.ts`,
      ),
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);
    const moduleBackendSchemaRootDirectory =
      this.parent.parent.parent.parent.parent.project.backend.project.schema
        .project.root.baseDirectory;

    await this.detach({
      indexPath: path.join(
        moduleBackendSchemaRootDirectory,
        `/src/lib/index.ts`,
      ),
    });

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

export class ExportTableAndVaritantEnumTable extends RegexCreator {
  constructor(props: {
    moduleName: string;
    modelNamePascalCased: string;
    importPath: string;
  }) {
    const place = ``;
    const placeRegex = new RegExp(``);
    const content = `export {
      Table as ${props.moduleName}${props.modelNamePascalCased},\n
      Relations as ${props.moduleName}${props.modelNamePascalCased}Relations,\n
    } from "${props.importPath}";`;

    const contentRegex = new RegExp(
      `export {([\\s]+?)?Table as ${props.moduleName}${props.modelNamePascalCased}([,]?)([\\s]+?)?Relations as ${props.moduleName}${props.modelNamePascalCased}Relations([,]?)([\\s]+?)?} from "${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
