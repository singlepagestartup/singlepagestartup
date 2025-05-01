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
import { Coder as BackendCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  parent: BackendCoder;
  tree: Tree;
  baseName: string;
  name: string;
  baseDirectory: string;
  absoluteName: string;
  project?: ProjectConfiguration;
  importApp: ImportApp;
  exportRoute: ExportRoute;
  importPath: string;

  constructor(props: { parent: BackendCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-app`;
    this.baseDirectory = `${this.parent.baseDirectory}/app/api`;
    this.absoluteName = `${this.parent.absoluteName}/app/api`;
    this.tree = props.tree;
    this.name = "api";

    this.importPath = this.absoluteName;

    const pluralNameModelName = pluralize(
      names(this.parent.parent.name).fileName,
    );
    const asPropertyModelName = names(this.parent.parent.name).propertyName;
    this.importApp = new ImportApp({
      importPath: this.importPath,
      asPropertyModelName,
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

    const moduleAppPath =
      this.parent.parent.parent.parent.parent.project.backend.project.app
        .project.api.baseDirectory;

    const moduleName = this.parent.parent.parent.parent.parent.name;
    const modelName = this.parent.parent.parent.name;

    console.log("🚀 ~ create ~ modelName:", modelName);

    const modelRepositoryDatabaseImportPath =
      this.parent.parent.project.repository.project.database.importPath;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        model_repository_database_import_path:
          modelRepositoryDatabaseImportPath,
        module_name: moduleName,
        model_name: modelName,
      },
    });

    // await this.attach({
    //   routesPath: path.join(moduleAppPath, "/src/lib/routes.ts"),
    // });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const moduleAppPath =
      this.parent.parent.parent.parent.parent.project.backend.project.app
        .project.api.baseDirectory;

    // await this.detach({
    //   routesPath: path.join(moduleAppPath, "/src/lib/routes.ts"),
    // });

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }

  async attach({ routesPath }: { routesPath: string }) {
    await addToFile({
      toTop: true,
      pathToFile: routesPath,
      content: this.importApp.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: routesPath,
      regex: this.exportRoute.onCreate.regex,
      content: this.exportRoute.onCreate.content,
    });
  }

  async detach({ routesPath }: { routesPath: string }) {
    try {
      const replaceExportRoutes = await replaceInFile({
        tree: this.tree,
        pathToFile: routesPath,
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
        pathToFile: routesPath,
        regex: this.importApp.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }
  }
}

export class ImportApp extends RegexCreator {
  constructor({
    asPropertyModelName,
    importPath,
  }: {
    asPropertyModelName: string;
    importPath: string;
  }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `import { app as ${asPropertyModelName} } from "${importPath}";`;

    const contentRegex = new RegExp(
      `import { app as ${asPropertyModelName} } from "${importPath}";`,
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
  constructor({
    route,
    asPropertyModelName,
  }: {
    route: string;
    asPropertyModelName: string;
  }) {
    const place = "export const routes = {";
    const placeRegex = new RegExp("export const routes = {");

    const content = `"${route}": ${asPropertyModelName},`;
    const contentRegex = new RegExp(
      `"${route}":([\\s]+?)${asPropertyModelName},`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
