import { ProjectConfiguration, Tree, getProjects, names } from "@nx/devkit";
import pluralize from "pluralize";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../../../utils/file-utils";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { util as createSpsTSLibrary } from "../../../../../../../../../../utils/create-sps-ts-library";
import { RegexCreator } from "../../../../../../../../../../utils/regex-utils/RegexCreator";
import { Coder as AppCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  parent: AppCoder;
  tree: Tree;
  baseName: string;
  name: string;
  baseDirectory: string;
  project?: ProjectConfiguration;
  absoluteName: string;
  importAppAsAsPropertyModelName: ImportAppAsAsPropertyModelName;
  exportRoute: ExportRoute;
  importPath: string;

  constructor(props: { parent: AppCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.tree = props.tree;
    this.name = "api";
    this.baseName = `${this.parent.baseName}-api`;
    this.baseDirectory = `${this.parent.baseDirectory}/api`;
    this.absoluteName = `${this.parent.absoluteName}/api`;

    this.importPath = this.absoluteName;

    const pluralNameModelName = pluralize(
      names(this.parent.parent.name).fileName,
    );
    const asPropertyModelName = names(this.parent.parent.name).propertyName;
    this.importAppAsAsPropertyModelName = new ImportAppAsAsPropertyModelName({
      asPropertyModelName,
      importPath: this.importPath,
    });
    this.exportRoute = new ExportRoute({
      route: `/${pluralNameModelName}`,
      asPropertyModelName,
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

  async create() {
    if (this.project) {
      return;
    }

    const modelImportPath = this.parent.project.model.importPath;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        model_import_path: modelImportPath,
      },
    });

    await this.attach();

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    await this.detach();

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }

  async attach() {
    const moduleAppRoutesPath = path.join(
      this.parent.parent.parent.parent.project.backend.project.app.project.api
        .baseDirectory,
      "/src/lib/routes.ts",
    );

    await addToFile({
      toTop: true,
      pathToFile: moduleAppRoutesPath,
      content: this.importAppAsAsPropertyModelName.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: moduleAppRoutesPath,
      regex: this.exportRoute.onCreate.regex,
      content: this.exportRoute.onCreate.content,
    });
  }

  async detach() {
    const moduleAppRoutesPath = path.join(
      this.parent.parent.parent.parent.project.backend.project.app.project.api
        .baseDirectory,
      "/src/lib/routes.ts",
    );

    try {
      const replaceExportRoutes = await replaceInFile({
        tree: this.tree,
        pathToFile: moduleAppRoutesPath,
        regex: this.exportRoute.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    try {
      const replaceImportRoutes = await replaceInFile({
        tree: this.tree,
        pathToFile: moduleAppRoutesPath,
        regex: this.importAppAsAsPropertyModelName.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }
  }
}

export class ImportAppAsAsPropertyModelName extends RegexCreator {
  constructor(props: { asPropertyModelName: string; importPath: string }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `import { app as ${props.asPropertyModelName} } from "${props.importPath}";`;

    const contentRegex = new RegExp(
      `import { app as ${props.asPropertyModelName} } from "${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      contentRegex,
      content,
    });
  }
}

export class ExportRoute extends RegexCreator {
  constructor(props: { route: string; asPropertyModelName: string }) {
    const place = "export const routes = {";
    const placeRegex = new RegExp("export const routes = {");

    const content = `"${props.route}": ${props.asPropertyModelName},`;
    const contentRegex = new RegExp(
      `"${props.route}":([\\s]+?)${props.asPropertyModelName},`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
