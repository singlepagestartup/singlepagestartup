import { Tree, formatFiles, getProjects, names } from "@nx/devkit";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { createSpsJsLibrary } from "../../../../utils/js-lib-utils";
import { addToFile, replaceInFile } from "../../../../utils/file-utils";

export class Builder {
  libName: string;
  root: string;
  snakeCaseModelName: string;
  modelName: string;
  tableLibraryName: string;
  relationsLibraryName: string;
  moduleRootSchemaProject: any;
  pascalSaseModelName: string;
  exportTableVariableName: string;
  exportTableRelationsVariableName: string;
  moduleRootSchemaProjectPath: string;
  exportSchema: ExportSchema;

  constructor({
    modelName,
    module,
    tree,
  }: {
    modelName: string;
    module: string;
    tree: Tree;
  }) {
    const libName = `@sps/${module}-models-${modelName}-backend-schema`;
    const baseDirectory = `libs/modules/${module}/models`;

    const root = `${baseDirectory}/${modelName}/backend/schema/root`;
    const tableLibraryName = `${libName}-table`;
    const relationsLibraryName = `${libName}-relations`;

    const moduleRootSchema = `@sps/${module}-backend-schema`;
    const moduleRootSchemaProject = getProjects(tree).get(moduleRootSchema);
    const moduleRootSchemaProjectPath = `${moduleRootSchemaProject.sourceRoot}/lib/schema.ts`;

    const pascalCaseModelName = names(modelName).className;
    const exportTableVariableName = `${pascalCaseModelName}Table`;
    const exportTableRelationsVariableName = `${pascalCaseModelName}Relations`;

    const exportSchema = new ExportSchema(
      exportTableVariableName,
      exportTableRelationsVariableName,
      libName,
    );

    this.libName = libName;
    this.root = root;
    this.modelName = modelName;
    this.tableLibraryName = tableLibraryName;
    this.relationsLibraryName = relationsLibraryName;
    this.moduleRootSchemaProject = moduleRootSchemaProject;
    this.pascalSaseModelName = pascalCaseModelName;
    this.exportTableVariableName = exportTableVariableName;
    this.exportTableRelationsVariableName = exportTableRelationsVariableName;
    this.exportSchema = exportSchema;
    this.moduleRootSchemaProjectPath = moduleRootSchemaProjectPath;
  }

  async attachToModule({ tree }: { tree: Tree }) {
    const backendAppProjectFileContent = await addToFile({
      toTop: true,
      pathToFile: this.moduleRootSchemaProjectPath,
      content: this.exportSchema.string,
      tree,
    });
  }

  async detachFromModule({ tree }: { tree: Tree }) {
    try {
      const replaceImportRoutes = await replaceInFile({
        tree,
        pathToFile: this.moduleRootSchemaProjectPath,
        regex: this.exportSchema.regex,
        content: "",
      });
    } catch (error) {
      if (
        error.message !==
        `No expected value found in file: ${this.exportSchema.regex}`
      ) {
        throw error;
      }
    }
  }

  async create({ tree }: { tree: Tree }) {
    await createSpsJsLibrary({
      tree,
      root: this.root,
      name: this.libName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        table_library_name: this.tableLibraryName,
        export_table_variable_name: this.exportTableVariableName,
        export_relations_variable_name: this.exportTableRelationsVariableName,
        relations_library_name: this.relationsLibraryName,
        model_name: this.pascalSaseModelName,
      },
    });

    await this.attachToModule({ tree });
  }

  async delete({ tree }: { tree: Tree }) {
    const project = getProjects(tree).get(this.libName);

    if (!project) {
      return;
    }

    await nxWorkspace.removeGenerator(tree, {
      projectName: this.libName,
      skipFormat: true,
      forceRemove: true,
    });

    await this.detachFromModule({ tree });

    await formatFiles(tree);
  }
}

export class ExportSchema {
  exportTableVariableName: string;
  exportTableRelationsVariableName: string;
  libName: string;
  string: string;
  regex: RegExp;

  constructor(
    exportTableVariableName: string,
    exportTableRelationsVariableName: string,
    libName: string,
  ) {
    const exportSchemaContent = `export {
      ${exportTableVariableName},\n
      ${exportTableRelationsVariableName},\n
    } from "${libName}";`;

    const exportSchemaContentRegex = new RegExp(
      `export {([\\s]+?)?${exportTableVariableName},([\\s]+?)?${exportTableRelationsVariableName}([,])?([\\s]+?)?} from "${libName}";`,
    );

    this.string = exportSchemaContent;
    this.regex = exportSchemaContentRegex;
  }
}
