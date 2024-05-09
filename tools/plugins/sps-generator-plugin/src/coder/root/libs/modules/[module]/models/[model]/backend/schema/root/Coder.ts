import {
  ProjectConfiguration,
  Tree,
  formatFiles,
  getProjects,
  names,
} from "@nx/devkit";
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

export class Coder {
  parent: SchemaCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  name: string;
  project: ProjectConfiguration;

  libName: string;
  root: string;
  tableLibraryName: string;
  relationsLibraryName: string;
  exportTableAndVaritantEnumTable: ExportTableAndVaritantEnumTable;

  constructor({ parent, tree }: { parent: SchemaCoder; tree: Tree }) {
    this.parent = parent;
    this.baseName = `${parent.baseName}-schema`;
    this.baseDirectory = `${parent.baseDirectory}/schema/root`;
    this.tree = tree;
    this.name = "schema";

    // const libName = `@sps/${module}-models-${modelName}-backend-schema`;
    // const baseDirectory = `libs/modules/${module}/models`;
    // const root = `${baseDirectory}/${modelName}/backend/schema/root`;
    // const tableLibraryName = `${libName}-table`;
    // const relationsLibraryName = `${libName}-relations`;
    // const moduleRootSchema = `@sps/${module}-backend-schema`;
    // const moduleRootSchemaProject = getProjects(tree).get(moduleRootSchema);
    // const moduleRootSchemaProjectPath = `${moduleRootSchemaProject.sourceRoot}/lib/index.ts`;

    const moduleName = parent.parent.parent.parent.parent.name;
    const moduleNameCuttedAndPascalCased = getModuleCuttedStyles({
      name: moduleName,
    }).pascalCased;

    const modelName = parent.parent.parent.name;
    const modelNamePascalCased = names(modelName).className;

    // this.libName = libName;
    // this.root = root;
    // this.tableLibraryName = tableLibraryName;
    // this.relationsLibraryName = relationsLibraryName;

    this.exportTableAndVaritantEnumTable = new ExportTableAndVaritantEnumTable({
      moduleName: moduleNameCuttedAndPascalCased,
      modelNamePascalCased,
      libName: this.baseName,
    });
  }

  async init() {
    this.project = getProjects(this.tree).get(this.baseName);
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
    } catch (error) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }
  }

  async create() {
    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        table_library_name: this.tableLibraryName,
        relations_library_name: this.relationsLibraryName,
      },
    });
  }

  async remove() {
    const project = getProjects(this.tree).get(this.libName);

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
  string: string;
  regex: RegExp;

  constructor({
    moduleName,
    modelNamePascalCased,
    libName,
  }: {
    moduleName: string;
    modelNamePascalCased: string;
    libName: string;
  }) {
    const place = ``;
    const placeRegex = new RegExp(``);
    const content = `export {
      Table as ${moduleName}${modelNamePascalCased},\n
      Relations as ${moduleName}${modelNamePascalCased}Relations,\n
      VariantEnumTable as ${moduleName}${modelNamePascalCased}VariantEnumTable,\n
    } from "${libName}";`;

    const contentRegex = new RegExp(
      `export {([\\s]+?)?Table as ${moduleName}${modelNamePascalCased}([,]?)([\\s]+?)?Relations as ${moduleName}${modelNamePascalCased}Relations([,]?)([\\s]+?)?VariantEnumTable as ${moduleName}${modelNamePascalCased}VariantEnumTable([,]?)([\\s]+?)?} from "${libName}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
